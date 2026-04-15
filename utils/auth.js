const TOKEN_KEY = 'traffic_token'
const ROLE_KEY = 'traffic_role'
const USER_INFO_KEY = 'traffic_user_info'

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

export function removeToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

export function setRole(role) {
  uni.setStorageSync(ROLE_KEY, role)
}

export function getRole() {
  return uni.getStorageSync(ROLE_KEY) || ''
}

export function setUserInfo(info) {
  uni.setStorageSync(USER_INFO_KEY, JSON.stringify(info))
}

export function getUserInfo() {
  const raw = uni.getStorageSync(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  uni.removeStorageSync(TOKEN_KEY)
  uni.removeStorageSync(ROLE_KEY)
  uni.removeStorageSync(USER_INFO_KEY)
}

export function logout() {
  clearAuth()
  uni.reLaunch({ url: '/pages/login/login' })
}
