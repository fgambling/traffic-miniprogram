<template>
  <view class="login-page">
    <!-- 全屏深色渐变背景 -->
    <view class="bg-layer" />

    <!-- 装饰圆 -->
    <view class="deco-circle deco-1" />
    <view class="deco-circle deco-2" />

    <!-- 顶部品牌区 -->
    <view class="brand-area">
      <view class="brand-icon">📊</view>
      <text class="brand-title">智慧客流分析</text>
      <text class="brand-sub">AI 驱动 · 精准洞察 · 智慧运营</text>
    </view>

    <!-- 底部登录卡片 -->
    <view class="login-card">
      <view class="card-header">
        <view class="card-dot" />
        <text class="card-hint">选择您的身份登录</text>
        <view class="card-dot" />
      </view>

      <button
        class="btn btn-wechat"
        @click="loginAs('merchant')"
        :disabled="loading"
      >
        <text class="btn-icon">💬</text>
        <text class="btn-text">微信一键登录</text>
        <view class="btn-badge">商家端</view>
      </button>

      <button
        class="btn btn-salesman"
        @click="loginAs('salesman')"
        :disabled="loading"
      >
        <text class="btn-icon">👤</text>
        <text class="btn-text">业务员工号登录</text>
      </button>

      <view class="agree-text">
        登录即同意
        <text class="link">用户协议</text>
        和
        <text class="link">隐私政策</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../store/user.js'

const loading = ref(false)
const { login } = useUserStore()

async function loginAs(role) {
  if (loading.value) return
  loading.value = true

  try {
    // Mock：直接生成本地 token，省去真实微信授权流程
    // 实际联调时：先调 wx.login() 获取 code，再 POST /api/auth/wx-login
    const mockData = {
      token: `mock_token_${role}_${Date.now()}`,
      userInfo: {
        nickname: role === 'merchant' ? '张老板' : '李业务员',
        avatar: '',
        merchantId: role === 'merchant' ? 'M001' : undefined,
        salesmanId: role === 'salesman' ? 'S001' : undefined
      }
    }

    login({ token: mockData.token, role, userInfo: mockData.userInfo })

    if (role === 'merchant') {
      uni.reLaunch({ url: '/pages/merchant/dashboard' })
    } else {
      uni.reLaunch({ url: '/pages/salesman/dashboard' })
    }
  } catch (e) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #0d1f3c;
}

/* 渐变背景层 */
.bg-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0d1f3c 0%, #162d50 45%, #1a3a6e 100%);
}

/* 装饰圆形 */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}

.deco-1 {
  width: 600rpx;
  height: 600rpx;
  top: -200rpx;
  right: -200rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.06);
}

.deco-2 {
  width: 400rpx;
  height: 400rpx;
  top: 100rpx;
  left: -180rpx;
  background: rgba(45, 111, 214, 0.12);
}

/* 品牌区 */
.brand-area {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 40rpx;

  .brand-icon {
    width: 160rpx;
    height: 160rpx;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06));
    border: 2rpx solid rgba(255,255,255,0.15);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  }

  .brand-title {
    font-size: 52rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 4rpx;
    margin-bottom: 16rpx;
  }

  .brand-sub {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 2rpx;
  }
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  padding: 48rpx 48rpx 60rpx;
  box-shadow: 0 -8rpx 60rpx rgba(0, 0, 0, 0.3);

  .card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin-bottom: 44rpx;

    .card-hint {
      font-size: 26rpx;
      color: #aaa;
    }

    .card-dot {
      width: 40rpx;
      height: 2rpx;
      background: #e0e0e0;
      border-radius: 2rpx;
    }
  }
}

/* 登录按钮 */
.btn {
  width: 100%;
  height: 100rpx;
  border-radius: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  border: none;
  line-height: 1;
  position: relative;

  &:active {
    opacity: 0.88;
    transform: scale(0.98);
  }

  &[disabled] {
    opacity: 0.6;
  }

  .btn-icon {
    font-size: 36rpx;
  }

  .btn-text {
    flex: 1;
    text-align: center;
  }
}

.btn-wechat {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.35);

  .btn-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-radius: 20rpx;
    font-weight: 500;
  }
}

.btn-salesman {
  background: #f4f6fa;
  color: #1f4788;
  border: 1rpx solid #dce5f5;

  .btn-text {
    color: #1f4788;
  }
}

.agree-text {
  font-size: 22rpx;
  color: #bbb;
  text-align: center;
  margin-top: 8rpx;

  .link {
    color: #1f4788;
  }
}
</style>
