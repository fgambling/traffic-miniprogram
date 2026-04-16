<script>
import { getToken, getRole } from './utils/auth.js'

export default {
  onLaunch() {
    const token = getToken()
    const role = getRole()
    if (token && role) {
      if (role === 'merchant') {
        uni.reLaunch({ url: '/pages/merchant/dashboard' })
      } else if (role === 'salesman') {
        uni.reLaunch({ url: '/pages/salesman/dashboard' })
      }
    } else {
      uni.reLaunch({ url: '/pages/login/login' })
    }
  },
  onShow() {},
  onHide() {}
}
</script>

<style lang="scss">
/* 全局公共样式 */
page {
  background-color: #f4f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* TabBar 底部安全占位（scroll-view 不识别 padding-bottom，必须用真实子元素） */
.tab-spacer {
  height: calc(124rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
}

/* WeChat miniprogram button reset */
button {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  font-size: inherit;
  color: inherit;
  line-height: inherit;
}
button::after {
  display: none;
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: $tab-bar-height;
}

/* 页面头部（深蓝渐变） */
.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 20rpx 32rpx 36rpx;
  flex-shrink: 0;

  .header-title {
    font-size: 34rpx;
    font-weight: 600;
  }

  .header-sub {
    font-size: 24rpx;
    opacity: 0.7;
    margin-top: 6rpx;
  }
}

/* 分区标题 */
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .more {
    font-size: 24rpx;
    color: #1f4788;
    font-weight: 400;
  }
}

/* 通用卡片 */
.card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* Tab 切换器 */
.tab-switch {
  display: flex;
  background: #e6eaf0;
  border-radius: 20rpx;
  margin: 24rpx 32rpx;
  padding: 6rpx;

  button {
    flex: 1;
    border: none;
    background: none;
    padding: 16rpx;
    border-radius: 16rpx;
    font-size: 26rpx;
    color: #666;
    line-height: 1;

    &.active {
      background: #fff;
      color: #1f4788;
      font-weight: 600;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.07);
    }
  }
}

/* FAB 按钮 */
.fab {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 36rpx rgba(31, 71, 136, 0.4);
  z-index: 50;

  image {
    width: 48rpx;
    height: 48rpx;
  }
}

/* 摘要行 */
.summary-row {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 16rpx;

  .summary-item {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    .si-val {
      font-size: 40rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .si-label {
      font-size: 20rpx;
      color: #999;
      margin-top: 4rpx;
    }
  }
}

/* 搜索框 */
.search-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  margin: 24rpx 32rpx 0;

  input {
    flex: 1;
    font-size: 26rpx;
    color: #333;
    border: none;
    background: transparent;
  }
}
</style>
