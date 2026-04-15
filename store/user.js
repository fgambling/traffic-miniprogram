import { reactive } from 'vue'
import { getToken, getRole, getUserInfo, setToken, setRole, setUserInfo, clearAuth } from '../utils/auth.js'

// 简单响应式单例 store（兼容无 Pinia 环境）
const state = reactive({
  token: getToken(),
  role: getRole(),    // 'merchant' | 'salesman'
  userInfo: getUserInfo()
})

export function useUserStore() {
  function login({ token, role, userInfo }) {
    state.token = token
    state.role = role
    state.userInfo = userInfo
    setToken(token)
    setRole(role)
    setUserInfo(userInfo)
  }

  function logoutStore() {
    state.token = ''
    state.role = ''
    state.userInfo = null
    clearAuth()
  }

  return {
    state,
    login,
    logout: logoutStore
  }
}
