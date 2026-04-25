// 使用新版 API 获取系统信息（替代已废弃的 getSystemInfoSync）
const windowInfo = uni.getWindowInfo()
const deviceInfo = uni.getDeviceInfo()

/** 状态栏高度 px（含刘海） */
export const statusBarHeight = windowInfo.statusBarHeight || 0

/** 导航栏总高度 = 状态栏 + 44px 标题栏 */
export const navBarHeight = statusBarHeight + 44

/** 屏幕宽度 px */
export const windowWidth = windowInfo.windowWidth || 375
