import { reactive } from 'vue'
import { getToken, getRole, getUserInfo, setToken, setRole, setUserInfo, clearAuth } from '../utils/auth.js'

const state = reactive({
  token: getToken(),
  role: getRole(),
  userInfo: getUserInfo()
})

export function useUserStore() {
  function login({ token, role, userId, merchantId, salesmanId, name }) {
    const userInfo = { userId, merchantId, salesmanId, name, nickname: name }
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
