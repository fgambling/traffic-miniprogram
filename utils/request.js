import { getToken, logout } from './auth.js'

// 开发/生产环境切换
// #ifdef MP-WEIXIN
const BASE_URL = 'https://api.example.com' // 替换为真实后端地址
// #endif
// #ifdef H5
const BASE_URL = '/api'
// #endif

let loadingCount = 0

function showLoading() {
  loadingCount++
  if (loadingCount === 1) {
    uni.showLoading({ title: '加载中...', mask: true })
  }
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    uni.hideLoading()
  }
}

/**
 * 封装 uni.request
 * @param {object} options - url, method, data, showLoad
 * @returns {Promise}
 */
export function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    showLoad = true,
    header = {}
  } = options

  if (showLoad) showLoading()

  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...header
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: headers,
      success(res) {
        if (showLoad) hideLoading()

        if (res.statusCode === 401) {
          logout()
          reject(new Error('登录已过期，请重新登录'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data
          // 后端约定：{ code: 0, data: ..., msg: '' }
          if (body.code === 0 || body.code === undefined) {
            resolve(body.data !== undefined ? body.data : body)
          } else {
            const msg = body.msg || body.message || '请求失败'
            uni.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          }
        } else {
          const msg = `服务器错误 ${res.statusCode}`
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail(err) {
        if (showLoad) hideLoading()
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function get(url, data = {}, options = {}) {
  return request({ url, method: 'GET', data, ...options })
}

export function post(url, data = {}, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}

export function put(url, data = {}, options = {}) {
  return request({ url, method: 'PUT', data, ...options })
}
