// 系统信息缓存（同步获取一次，全局复用）
const sysInfo = uni.getSystemInfoSync()

/** 状态栏高度 px（含刘海） */
export const statusBarHeight = sysInfo.statusBarHeight || 0

/** 导航栏总高度 = 状态栏 + 44px 标题栏 */
export const navBarHeight = statusBarHeight + 44

/** 屏幕宽度 px */
export const windowWidth = sysInfo.windowWidth || 375
