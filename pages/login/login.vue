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
        @click="showMerchantForm = true"
        :disabled="loading"
      >
        <text class="btn-text">商家端登录</text>
      </button>

      <!-- 商家手机号+密码表单 -->
      <view v-if="showMerchantForm" class="salesman-form">
        <view class="sf-title">商家登录</view>
        <input
          v-model="merchantPhone"
          class="sf-input"
          placeholder="手机号"
          type="number"
          maxlength="11"
        />
        <input
          v-model="merchantPassword"
          class="sf-input"
          placeholder="密码"
          password
        />
        <button class="sf-btn sf-btn-merchant" @click="merchantLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <view class="sf-cancel" @click="showMerchantForm = false">取消</view>
      </view>

      <button
        class="btn btn-salesman"
        @click="showSalesmanForm = true"
        :disabled="loading"
      >
        <text class="btn-text">业务员工号登录</text>
      </button>

      <!-- 业务员手机号+密码表单 -->
      <view v-if="showSalesmanForm" class="salesman-form">
        <view class="sf-title">业务员登录</view>
        <input
          v-model="salesmanPhone"
          class="sf-input"
          placeholder="手机号"
          type="number"
          maxlength="11"
        />
        <input
          v-model="salesmanPassword"
          class="sf-input"
          placeholder="密码"
          password
        />
        <button class="sf-btn" @click="salesmanLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <view class="sf-cancel" @click="showSalesmanForm = false">取消</view>
      </view>

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

const loading           = ref(false)
const showMerchantForm  = ref(false)
const merchantPhone     = ref('')
const merchantPassword  = ref('')
const showSalesmanForm  = ref(false)
const salesmanPhone     = ref('')
const salesmanPassword  = ref('')
const { login } = useUserStore()

async function merchantLogin() {
  if (!merchantPhone.value || !merchantPassword.value) {
    uni.showToast({ title: '请填写手机号和密码', icon: 'none' }); return
  }
  loading.value = true
  try {
    const data = await post('/api/auth/merchant-login', {
      phone:    merchantPhone.value,
      password: merchantPassword.value
    }, { showLoad: false })
    login({
      token:      data.token,
      role:       data.role,
      userId:     data.userId,
      merchantId: data.merchantId,
      name:       data.name
    })
    setTimeout(() => uni.reLaunch({ url: '/pages/merchant/dashboard' }), 100)
  } catch (e) {
    const msg = e?.data?.message || '手机号或密码错误'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function salesmanLogin() {
  if (!salesmanPhone.value || !salesmanPassword.value) {
    uni.showToast({ title: '请填写手机号和密码', icon: 'none' }); return
  }
  loading.value = true
  try {
    const data = await post('/api/auth/salesman-login', {
      phone:    salesmanPhone.value,
      password: salesmanPassword.value
    }, { showLoad: false })
    login({
      token:    data.token,
      role:     data.role,
      userId:   data.userId,
      name:     data.name
    })
    setTimeout(() => uni.reLaunch({ url: '/pages/salesman/dashboard' }), 100)
  } catch (e) {
    const msg = e?.data?.message || '手机号或密码错误'
    uni.showToast({ title: msg, icon: 'none' })
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
  line-height: 100rpx;
  position: relative;

  &:active {
    opacity: 0.88;
    transform: scale(0.98);
  }

  &[disabled] {
    opacity: 0.6;
  }

  .btn-text {
    font-size: 30rpx;
    font-weight: 600;
  }
}

.btn-wechat {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.35);

}

.btn-salesman {
  background: #f4f6fa;
  color: #1f4788;
  border: 1rpx solid #dce5f5;
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

/* 业务员登录表单 */
.salesman-form {
  margin-top: 16rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;

  .sf-title {
    font-size: 26rpx;
    color: #1f4788;
    font-weight: 600;
    margin-bottom: 20rpx;
    text-align: center;
  }

  .sf-input {
    width: 100%;
    height: 88rpx;
    background: #f4f6fa;
    border-radius: 20rpx;
    padding: 0 28rpx;
    font-size: 28rpx;
    color: #333;
    box-sizing: border-box;
    margin-bottom: 16rpx;
    border: 1rpx solid #e8edf5;
  }

  .sf-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
    margin-bottom: 16rpx;
  }

  .sf-btn-merchant {
    background: linear-gradient(135deg, #07c160, #06ad56);
  }

  .sf-cancel {
    text-align: center;
    font-size: 26rpx;
    color: #aaa;
    padding: 8rpx;
  }
}

</style>
