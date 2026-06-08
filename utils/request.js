import { getToken, setToken, setRole, setUserInfo, getRole, logout } from './auth.js'

// 按环境自动切换后端地址：
// - 开发（运行/真机调试）走内网；真机调试时把下方 IP 改成"当前电脑"的局域网 IP
// - 正式（npm run build / 发布版）走线上 https 域名
// 正式发布前需：①服务器配好域名+SSL ②把 PROD_BASE_URL 改成你的域名
//             ③在微信公众平台「服务器域名 - request 合法域名」里登记该域名
const DEV_BASE_URL  = 'http://192.168.0.108:8080'
const PROD_BASE_URL = 'https://api.你的域名.com'

export const BASE_URL = process.env.NODE_ENV === 'development'
  ? DEV_BASE_URL
  : PROD_BASE_URL

let loadingCount = 0
let isReLogging = false

// token 过期时用已保存的凭据静默重新登录，成功返回 true
function trySilentReLogin() {
  if (isReLogging) return Promise.resolve(false)
  isReLogging = true

  const role = getRole()
  let url, body
  if (role === 'merchant') {
    const phone    = uni.getStorageSync('login_merchant_phone')
    const password = uni.getStorageSync('login_merchant_pwd')
    if (!phone || !password) { isReLogging = false; return Promise.resolve(false) }
    url  = '/api/auth/merchant-login'
    body = { phone, password }
  } else if (role === 'salesman') {
    const phone    = uni.getStorageSync('login_salesman_phone')
    const password = uni.getStorageSync('login_salesman_pwd')
    if (!phone || !password) { isReLogging = false; return Promise.resolve(false) }
    url  = '/api/auth/salesman-login'
    body = { phone, password }
  } else {
    isReLogging = false
    return Promise.resolve(false)
  }

  return new Promise(resolve => {
    uni.request({
      url: BASE_URL + url,
      method: 'POST',
      data: body,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        isReLogging = false
        if (res.statusCode === 200 && res.data?.code === 0) {
          const data = res.data.data
          if (data.needSelect) { resolve(false); return }
          setToken(data.token)
          if (data.role) setRole(data.role)
          setUserInfo({ userId: data.userId, merchantId: data.merchantId, name: data.name })
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail() { isReLogging = false; resolve(false) }
    })
  })
}

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

export function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    showLoad = true,
    header = {},
    timeout = 30000,
    _retried = false
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
      timeout,
      success(res) {
        if (showLoad) hideLoading()

        if (res.statusCode === 401) {
          if (!_retried) {
            trySilentReLogin().then(ok => {
              if (ok) {
                request({ ...options, _retried: true }).then(resolve).catch(reject)
              } else {
                logout()
                reject(new Error('登录已过期，请重新登录'))
              }
            })
          } else {
            logout()
            reject(new Error('登录已过期，请重新登录'))
          }
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data
          if (body.code === 0) {
            resolve(body.data !== undefined ? body.data : body)
          } else if (body.code === 403) {
            uni.showToast({ title: '请升级套餐后使用', icon: 'none' })
            reject(new Error('无权限'))
          } else {
            const msg = body.message || '请求失败'
            uni.showToast({ title: msg, icon: 'none' })
            reject(new Error(msg))
          }
        } else if (res.statusCode === 403) {
          uni.showToast({ title: '请升级套餐后使用', icon: 'none' })
          reject(new Error('无权限'))
        } else {
          const msg = `服务器错误 ${res.statusCode}`
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail(err) {
        if (showLoad) hideLoading()
        const isTimeout = err?.errMsg?.includes('timeout')
        uni.showToast({ title: isTimeout ? '请求超时，请稍后重试' : '网络连接失败', icon: 'none' })
        reject(new Error(isTimeout ? 'timeout' : (err?.errMsg || '网络连接失败')))
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

export function del(url, data = {}, options = {}) {
  return request({ url, method: 'DELETE', data, ...options })
}
