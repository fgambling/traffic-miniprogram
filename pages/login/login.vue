<template>
  <view class="login-page">
    <!-- 上半：深蓝渐变 -->
    <view class="hero">
      <view class="brand-icon">🏪</view>
      <view class="brand-title">智慧客流分析</view>
      <view class="brand-sub">AI驱动的门店经营助手</view>
    </view>

    <!-- 下半：按钮区 -->
    <view class="actions">
      <button class="btn btn-primary" @click="loginAs('merchant')" :disabled="loading">
        <text>💬</text>
        <text>微信一键登录（商家端）</text>
      </button>

      <button class="btn btn-secondary" @click="loginAs('salesman')" :disabled="loading">
        <text>👤</text>
        <text>业务员登录</text>
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
import { post } from '../../utils/request.js'

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

/* 真实微信登录流程（联调时替换 loginAs 中的 mock 部分）：
async function wxLogin(role) {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async ({ code }) => {
        try {
          const data = await post('/api/auth/wx-login', { code, role })
          resolve(data)
        } catch(e) { reject(e) }
      },
      fail: reject
    })
  })
}
*/
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .hero {
    background: linear-gradient(180deg, #162d50 0%, #1f4788 100%);
    flex: 0 0 38vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-bottom: 60rpx;

    .brand-icon {
      width: 128rpx;
      height: 128rpx;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 64rpx;
      margin-bottom: 32rpx;
    }

    .brand-title {
      font-size: 44rpx;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .brand-sub {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .actions {
    background: #f4f5f9;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 64rpx 0;

    .btn {
      width: 100%;
      height: 96rpx;
      border-radius: 24rpx;
      font-size: 30rpx;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16rpx;
      margin-bottom: 24rpx;
      border: none;
      line-height: 1;

      &:active {
        opacity: 0.88;
      }

      &[disabled] {
        opacity: 0.6;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, #07c160, #06ad56);
      color: #fff;
    }

    .btn-secondary {
      background: #fff;
      color: #1f4788;
      border: 1rpx solid #e0e0e0;
    }

    .agree-text {
      font-size: 22rpx;
      color: #999;
      margin-top: 40rpx;
      text-align: center;

      .link {
        color: #1f4788;
      }
    }
  }
}
</style>
