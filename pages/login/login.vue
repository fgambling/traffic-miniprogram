<template>
  <view class="login-page">
    <view class="bg-layer" />
    <view class="deco-circle deco-1" />
    <view class="deco-circle deco-2" />

    <!-- 品牌区 -->
    <view class="brand-area">
      <view class="brand-icon">
        <image v-if="isImageLogo" :src="logoDisplayUrl" class="brand-logo-img" mode="aspectFill" />
        <text v-else>{{ appCfg.logo }}</text>
      </view>
      <text class="brand-title">{{ appCfg.brandTitle }}</text>
      <text class="brand-sub">{{ appCfg.slogan }}</text>
    </view>

    <!-- 底部卡片 -->
    <view class="login-card">

      <!-- ① 身份选择 -->
      <view v-if="!selectedRole" class="step-select">
        <view class="card-header">
          <view class="card-dot" />
          <text class="card-hint">选择您的身份登录</text>
          <view class="card-dot" />
        </view>

        <button class="btn btn-merchant" @click="selectedRole = 'merchant'" :disabled="loading">
          <text class="btn-text">商家端登录</text>
        </button>

        <button class="btn btn-salesman" @click="selectedRole = 'salesman'" :disabled="loading">
          <text class="btn-text">业务员工号登录</text>
        </button>

        <view class="agree-text">
          登录即同意
          <text class="link">用户协议</text>
          和
          <text class="link">隐私政策</text>
        </view>
      </view>

      <!-- ② 登录表单 -->
      <view v-else class="step-form">
        <view class="form-nav">
          <view class="form-back" @click="selectedRole = null">
            <text class="back-arrow">‹</text>
            <text class="back-text">返回</text>
          </view>
          <text class="form-title">{{ selectedRole === 'merchant' ? '商家登录' : '业务员登录' }}</text>
          <view class="form-nav-spacer" />
        </view>

        <input
          v-model="currentPhone"
          class="sf-input"
          placeholder="手机号"
          type="number"
          maxlength="11"
        />
        <input
          v-model="currentPassword"
          class="sf-input"
          placeholder="密码"
          password
        />

        <button
          class="sf-btn"
          :class="selectedRole === 'merchant' ? 'sf-btn-merchant' : 'sf-btn-salesman'"
          @click="handleLogin"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <view class="agree-text">
          登录即同意
          <text class="link">用户协议</text>
          和
          <text class="link">隐私政策</text>
        </view>
      </view>

    </view>

    <!-- 多商家选择弹窗 -->
    <view v-if="showSelectSheet" class="sheet-mask" @click.self="showSelectSheet = false">
      <view class="sheet">
        <view class="sheet-title">请选择要登录的店铺</view>
        <view
          v-for="item in merchantList"
          :key="item.merchantId"
          class="sheet-item"
          @click="selectMerchant(item.merchantId)"
        >
          <view class="sheet-item-name">{{ item.name }}</view>
          <view class="sheet-item-addr">{{ item.address || item.licenseNo }}</view>
        </view>
        <view class="sheet-cancel" @click="showSelectSheet = false">取消</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../store/user.js'
import { post, BASE_URL } from '../../utils/request.js'

const loading         = ref(false)
const selectedRole    = ref(null)   // null | 'merchant' | 'salesman'
const appCfg      = ref({ logo: '📊', brandTitle: '智慧客流分析', slogan: 'AI 驱动 · 精准洞察 · 智慧运营' })
const logoLocalUrl = ref('')
const isImageLogo = computed(() => appCfg.value.logo.startsWith('/uploads/') || appCfg.value.logo.startsWith('http'))
const logoUrl     = computed(() => {
  const l = appCfg.value.logo
  return l.startsWith('http') ? l : BASE_URL + l
})
const logoDisplayUrl = computed(() => logoLocalUrl.value || logoUrl.value)
const merchantPhone   = ref('')
const merchantPassword = ref('')
const salesmanPhone   = ref('')
const salesmanPassword = ref('')
const showSelectSheet = ref(false)
const merchantList    = ref([])
const { login } = useUserStore()

const currentPhone    = computed({
  get: () => selectedRole.value === 'merchant' ? merchantPhone.value : salesmanPhone.value,
  set: v  => { if (selectedRole.value === 'merchant') merchantPhone.value = v; else salesmanPhone.value = v }
})
const currentPassword = computed({
  get: () => selectedRole.value === 'merchant' ? merchantPassword.value : salesmanPassword.value,
  set: v  => { if (selectedRole.value === 'merchant') merchantPassword.value = v; else salesmanPassword.value = v }
})

onMounted(() => {
  // 拉取后台配置（logo / 品牌名 / slogan）
  uni.request({
    url: BASE_URL + '/api/public/app-config',
    method: 'GET',
    success: ({ data }) => {
      if (data?.data) {
        Object.assign(appCfg.value, data.data)
        cacheLogo()
      }
    },
    fail: () => {}
  })
  try {
    const mp = uni.getStorageSync('login_merchant_phone')
    const mw = uni.getStorageSync('login_merchant_pwd')
    const sp = uni.getStorageSync('login_salesman_phone')
    const sw = uni.getStorageSync('login_salesman_pwd')
    const lastRole = uni.getStorageSync('login_last_role')
    if (mp) merchantPhone.value    = mp
    if (mw) merchantPassword.value = mw
    if (sp) salesmanPhone.value    = sp
    if (sw) salesmanPassword.value = sw
    if (lastRole === 'merchant' && mp) selectedRole.value = 'merchant'
    if (lastRole === 'salesman' && sp) selectedRole.value = 'salesman'
  } catch (_) {}
})

function cacheLogo() {
  logoLocalUrl.value = ''
  if (!isImageLogo.value) return
  const url = logoUrl.value
  if (!url?.startsWith('http')) return
  uni.downloadFile({
    url,
    success: (res) => {
      if (res.statusCode === 200 && res.tempFilePath) {
        logoLocalUrl.value = res.tempFilePath
      }
    }
  })
}

function saveCredentials(role, phone, pwd) {
  try {
    if (role === 'merchant') {
      uni.setStorageSync('login_merchant_phone', phone)
      uni.setStorageSync('login_merchant_pwd',   pwd)
    } else {
      uni.setStorageSync('login_salesman_phone', phone)
      uni.setStorageSync('login_salesman_pwd',   pwd)
    }
    uni.setStorageSync('login_last_role', role)
  } catch (_) {}
}

function handleLogin() {
  if (selectedRole.value === 'merchant') merchantLogin()
  else salesmanLogin()
}

// ─── 商家登录 ─────────────────────────────────────────────────
function doMerchantLogin(data) {
  login({ token: data.token, role: data.role, userId: data.userId, merchantId: data.merchantId, name: data.name })
  setTimeout(() => uni.reLaunch({ url: '/pages/merchant/dashboard' }), 100)
}

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
    if (data.needSelect) {
      merchantList.value = data.merchants
      showSelectSheet.value = true
    } else {
      saveCredentials('merchant', merchantPhone.value, merchantPassword.value)
      doMerchantLogin(data)
    }
  } catch (e) {
    uni.showToast({ title: e?.data?.message || '手机号或密码错误', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function selectMerchant(merchantId) {
  showSelectSheet.value = false
  loading.value = true
  try {
    const data = await post('/api/auth/merchant-select', {
      phone:      merchantPhone.value,
      merchantId: merchantId
    }, { showLoad: false })
    saveCredentials('merchant', merchantPhone.value, merchantPassword.value)
    doMerchantLogin(data)
  } catch (e) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ─── 业务员登录 ───────────────────────────────────────────────
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
    saveCredentials('salesman', salesmanPhone.value, salesmanPassword.value)
    login({ token: data.token, role: data.role, userId: data.userId, name: data.name })
    setTimeout(() => uni.reLaunch({ url: '/pages/salesman/dashboard' }), 100)
  } catch (e) {
    uni.showToast({ title: e?.data?.message || '手机号或密码错误', icon: 'none' })
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

.bg-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #0d1f3c 0%, #162d50 45%, #1a3a6e 100%);
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}
.deco-1 {
  width: 600rpx; height: 600rpx;
  top: -200rpx; right: -200rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.06);
}
.deco-2 {
  width: 400rpx; height: 400rpx;
  top: 100rpx; left: -180rpx;
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
    width: 160rpx; height: 160rpx;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06));
    border: 2rpx solid rgba(255,255,255,0.15);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    margin-bottom: 40rpx;
    box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.3);
    overflow: hidden;

    .brand-logo-img {
      width: 100%;
      height: 100%;
    }
  }

  .brand-title {
    font-size: 52rpx; font-weight: 700;
    color: #fff; letter-spacing: 4rpx;
    margin-bottom: 16rpx;
  }

  .brand-sub {
    font-size: 26rpx;
    color: rgba(255,255,255,0.5);
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
  box-shadow: 0 -8rpx 60rpx rgba(0,0,0,0.3);
}

/* ── 步骤1：身份选择 ── */
.step-select {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    margin-bottom: 44rpx;

    .card-hint { font-size: 26rpx; color: #aaa; }
    .card-dot  { width: 40rpx; height: 2rpx; background: #e0e0e0; border-radius: 2rpx; }
  }
}

/* 身份按钮 */
.btn {
  width: 100%;
  height: 100rpx;
  border-radius: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  border: none;
  line-height: 100rpx;

  &:active  { opacity: 0.88; transform: scale(0.98); }
  &[disabled] { opacity: 0.6; }

  .btn-text { font-size: 30rpx; font-weight: 600; }
}

.btn-merchant {
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(7,193,96,0.35);
}

.btn-salesman {
  background: #f4f6fa;
  color: #1f4788;
  border: 1rpx solid #dce5f5;
}

/* ── 步骤2：登录表单 ── */
.step-form {
  .form-nav {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;

    .form-back {
      display: flex;
      align-items: center;
      gap: 4rpx;
      padding: 8rpx 0;

      &:active { opacity: 0.6; }

      .back-arrow { font-size: 44rpx; color: #1f4788; line-height: 1; font-weight: 300; }
      .back-text  { font-size: 26rpx; color: #1f4788; }
    }

    .form-title {
      flex: 1;
      text-align: center;
      font-size: 32rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .form-nav-spacer { width: 80rpx; }
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
    margin-bottom: 20rpx;
    border: 1rpx solid #e8edf5;
  }

  .sf-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
    margin-top: 8rpx;
    margin-bottom: 24rpx;

    &[disabled] { opacity: 0.6; }
  }

  .sf-btn-merchant { background: linear-gradient(135deg, #07c160, #06ad56); box-shadow: 0 8rpx 32rpx rgba(7,193,96,0.3); }
  .sf-btn-salesman { background: linear-gradient(135deg, #1a4a8a, #2d6fd6); box-shadow: 0 8rpx 32rpx rgba(45,111,214,0.3); }
}

/* 协议文字 */
.agree-text {
  font-size: 22rpx;
  color: #bbb;
  text-align: center;

  .link { color: #1f4788; }
}

/* 多商家选择弹窗 */
.sheet-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx 60rpx;

  .sheet-title {
    font-size: 30rpx; font-weight: 600;
    color: #333; text-align: center;
    margin-bottom: 32rpx;
  }

  .sheet-item {
    padding: 28rpx 24rpx;
    border-radius: 20rpx;
    background: #f4f6fa;
    margin-bottom: 16rpx;

    &:active { background: #e8edf5; }

    .sheet-item-name { font-size: 30rpx; font-weight: 600; color: #1f4788; margin-bottom: 8rpx; }
    .sheet-item-addr { font-size: 24rpx; color: #888; }
  }

  .sheet-cancel {
    text-align: center;
    font-size: 28rpx;
    color: #aaa;
    margin-top: 24rpx;
    padding: 12rpx;
  }
}
</style>
