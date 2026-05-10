<template>
  <view class="page">
    <!-- Header -->
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">我的</view>
      </view>
      <view class="profile-row">
        <view class="avatar">{{ avatarText }}</view>
        <view class="profile-info">
          <view class="profile-name-row">
            <text class="profile-name">{{ storeName }}</text>
            <view class="pkg-badge" :class="pkgBadgeClass">{{ pkgName }}</view>
          </view>
          <text class="profile-phone">{{ phone || '未绑定手机号' }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="scroll-area" scroll-y>

      <!-- 套餐条 -->
      <view class="pkg-strip" @click="packageType < 3 && (showUpgradeSheet = true)">
        <view class="ps-left">
          <text class="ps-feature">{{ aiFeature }}</text>
          <text class="ps-expire">有效期：{{ pkgExpire }}</text>
        </view>
        <view v-if="packageType < 3" class="ps-upgrade-btn">升级套餐 ›</view>
        <view v-else class="ps-top-tag">最高版本</view>
      </view>

      <!-- 统一菜单卡 -->
      <view class="menu-card">
        <!-- 切换门店 -->
        <view class="menu-row" @click="openStoreSheet">
          <text class="menu-icon">🏪</text>
          <text class="menu-label">切换门店</text>
          <text class="menu-val">{{ storeName }}</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 门店信息 -->
        <view class="menu-row" @click="goIfAdv('/pages/merchant/business-info')">
          <text class="menu-icon">🍽️</text>
          <text class="menu-label">门店信息</text>
          <text class="menu-val">菜单 · 促销 · 客群</text>
          <text class="menu-arrow">›</text>
        </view>

        <!-- 规则配置 -->
        <view class="menu-row" @click="goIfMid('/pages/merchant/rules')">
          <text class="menu-icon">⚙️</text>
          <text class="menu-label">规则配置</text>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-divider" />

        <view class="menu-row" @click="showPhoneSheet = true">
          <text class="menu-icon">📱</text>
          <text class="menu-label">手机号</text>
          <text class="menu-val">{{ phoneMasked }}</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-row" @click="openPwdSheet">
          <text class="menu-icon">🔒</text>
          <text class="menu-label">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-row" @click="showAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-label">关于系统</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <button class="btn-logout" @click="confirmLogout">退出登录</button>

      <view class="tab-spacer" />
    </scroll-view>

    <TabBar role="merchant" :current="3" />

    <!-- 绑定手机号弹层 -->
    <BottomSheet :show="showPhoneSheet" title="绑定手机号" @close="showPhoneSheet = false">
      <view class="form">
        <view class="form-row">
          <text class="form-label">手机号</text>
          <input
            class="form-input"
            v-model="phoneInput"
            type="number"
            maxlength="11"
            placeholder="请输入手机号"
          />
        </view>
        <button class="btn-primary" @click="savePhone">确认绑定</button>
      </view>
    </BottomSheet>

    <!-- 切换门店弹层 -->
    <BottomSheet :show="showStoreSheet" title="切换门店" @close="showStoreSheet = false">
      <view class="store-list">
        <view
          v-for="s in storeList"
          :key="s.merchantId"
          class="store-item"
          :class="{ active: s.merchantId === currentStoreId }"
          @click="switchStore(s)"
        >
          <view class="si-info">
            <text class="si-name">{{ s.name }}</text>
            <text v-if="s.address" class="si-addr">{{ s.address }}</text>
          </view>
          <text v-if="s.merchantId === currentStoreId" class="si-tag">当前</text>
        </view>
        <view v-if="storeList.length <= 1" class="si-empty">该账号暂无其他门店</view>
      </view>
    </BottomSheet>

    <!-- 修改密码弹层 -->
    <BottomSheet :show="showPwdSheet" title="修改密码" @close="closePwdSheet">
      <view class="form">
        <view class="form-row">
          <text class="form-label">原密码</text>
          <input class="form-input" v-model="pwdForm.old" :password="true" placeholder="请输入原密码" />
        </view>
        <view class="form-row">
          <text class="form-label">新密码</text>
          <input class="form-input" v-model="pwdForm.next" :password="true" placeholder="至少6位" />
        </view>
        <view class="form-row">
          <text class="form-label">确认密码</text>
          <input class="form-input" v-model="pwdForm.confirm" :password="true" placeholder="再次输入新密码" />
        </view>
        <button class="btn-primary" @click="submitPwd">确认修改</button>
      </view>
    </BottomSheet>

    <!-- 升级弹层 -->
    <BottomSheet :show="showUpgradeSheet" title="升级套餐" @close="showUpgradeSheet = false">
      <view class="upgrade-sheet">
        <!-- 当前套餐 -->
        <view class="us-current">
          <text class="us-cur-label">当前套餐</text>
          <view class="us-cur-badge" :class="pkgBadgeClass">{{ pkgName }}</view>
        </view>

        <!-- 可升级选项 -->
        <view class="us-options">
          <!-- 普通版 → 中级版 -->
          <view v-if="packageType === 1" class="us-tier-card">
            <view class="us-tier-head">
              <view class="us-tier-badge badge-mid">中级版</view>
              <text class="us-tier-price">¥99 / 月</text>
            </view>
            <view class="us-tier-features">
              <text class="us-feat">✓ 规则引擎 AI 经营建议（无限次）</text>
              <text class="us-feat">✓ 备货 / 排班 / 营销三大类建议</text>
              <text class="us-feat">✓ 自定义规则配置</text>
              <text class="us-feat">✓ 最多 15 天自定义日期分析</text>
            </view>
            <button class="us-btn" @click="handleUpgrade(2)">升级中级版</button>
          </view>

          <!-- 普通版 / 中级版 → 高级版 -->
          <view class="us-tier-card us-tier-card--advanced">
            <view class="us-tier-head">
              <view class="us-tier-badge badge-advanced">高级版</view>
              <text class="us-tier-price">¥299 / 月</text>
            </view>
            <view class="us-tier-features">
              <text class="us-feat">✓ 包含中级版全部功能</text>
              <text class="us-feat">✓ AI 大模型个性化建议</text>
              <text class="us-feat">✓ 历史同期对比分析</text>
              <text class="us-feat">✓ 报表导出</text>
            </view>
            <button class="us-btn us-btn--advanced" @click="handleUpgrade(3)">升级高级版</button>
          </view>
        </view>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { useUserStore } from '../../store/user.js'
import { statusBarHeight } from '../../utils/system.js'
import { get, post, put } from '../../utils/request.js'

const { state, login, logout } = useUserStore()
const userInfo = state.userInfo

// ── 基础信息 ────────────────────────────────────────────────
const storeName      = ref(userInfo?.name || '我的门店')
const phone          = ref('')
const currentStoreId = ref(userInfo?.merchantId || null)

// ── 套餐信息：1=普通 2=中级 3=高级 ──────────────────────────
const packageType = ref(1)
const expireDate  = ref('')

const pkgName = computed(() => ['', '普通版', '中级版', '高级版'][packageType.value] || '普通版')
const pkgBadgeClass = computed(() => ['', 'badge-basic', 'badge-mid', 'badge-advanced'][packageType.value] || 'badge-basic')
const pkgBadgeText  = computed(() => ['', '免费', '中级', '高级'][packageType.value] || '免费')
const pkgExpire = computed(() => packageType.value === 1 ? '永久有效' : (expireDate.value || '--'))
const aiFeature = computed(() => {
  if (packageType.value === 1) return '不含 AI 建议'
  if (packageType.value === 2) return 'AI 建议（规则引擎）'
  return 'AI 建议（大模型）'
})

// ── 门店列表 ────────────────────────────────────────────────
const storeList    = ref([])
const storePhone   = ref('')   // 当前商家绑定的手机号（切换时需要传给后端）

// ── 弹层状态 ────────────────────────────────────────────────
const showPhoneSheet   = ref(false)
const showStoreSheet   = ref(false)
const showUpgradeSheet = ref(false)
const showPwdSheet     = ref(false)
const phoneInput       = ref('')
const pwdForm          = ref({ old: '', next: '', confirm: '' })

// ── 计算属性 ────────────────────────────────────────────────
const avatarText  = computed(() => (storeName.value || '店')[0])
const phoneMasked = computed(() => {
  const p = phone.value
  if (!p || p.length < 11) return p || '未绑定'
  return p.slice(0, 3) + '****' + p.slice(7)
})

// ── 数据加载 ────────────────────────────────────────────────
async function fetchMerchantInfo() {
  try {
    const data = await get('/api/merchant/dashboard', {}, { showLoad: false })
    if (data) {
      storeName.value = data.merchantName || storeName.value
      if (data.packageType) packageType.value = data.packageType
    }
  } catch (_) {}
}

async function fetchStores() {
  try {
    const data = await get('/api/merchant/stores', {}, { showLoad: false })
    storeList.value  = data.stores  || []
    storePhone.value = data.phone   || ''
    phone.value      = data.phone   || ''
  } catch (_) {}
}

function handleUpgrade(targetTier) {
  showUpgradeSheet.value = false
  const names = { 2: '中级版', 3: '高级版' }
  uni.showModal({
    title: `升级 ${names[targetTier]}`,
    content: `确认升级到${names[targetTier]}？正式版本将跳转至支付流程，当前为演示模式。`,
    confirmText: '确认',
    success: ({ confirm }) => {
      if (confirm) uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
    }
  })
}

onMounted(() => {
  fetchMerchantInfo()
  fetchStores()
})

// ── 绑定/修改手机号 ─────────────────────────────────────────
async function savePhone() {
  const val = phoneInput.value.trim()
  if (!/^1\d{10}$/.test(val)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
  }
  try {
    await put('/api/merchant/phone', { phone: val })
    phone.value      = val
    storePhone.value = val
    showPhoneSheet.value = false
    uni.showToast({ title: '手机号已更新', icon: 'success' })
    fetchStores()   // 手机号变了，门店分组随之变化，刷新列表
  } catch (e) {
    uni.showToast({ title: e.message || '修改失败', icon: 'none' })
  }
}

// ── 切换门店 ────────────────────────────────────────────────
function openStoreSheet() {
  if (storeList.value.length === 0) fetchStores()
  showStoreSheet.value = true
}

async function switchStore(store) {
  if (store.merchantId === currentStoreId.value) {
    showStoreSheet.value = false; return
  }
  try {
    const data = await post('/api/auth/merchant-select', {
      phone:      storePhone.value,
      merchantId: store.merchantId
    }, { showLoad: false })

    // 更新 token 和 userInfo
    login({
      token:      data.token,
      role:       'merchant',
      userId:     data.userId || store.merchantId,
      merchantId: store.merchantId,
      name:       store.name
    })

    showStoreSheet.value = false
    currentStoreId.value = store.merchantId
    storeName.value      = store.name

    uni.showToast({ title: `已切换到 ${store.name}`, icon: 'success' })
    // 刷新当前页面数据
    setTimeout(() => {
      fetchMerchantInfo()
      fetchStores()
    }, 300)
  } catch (e) {
    uni.showToast({ title: '切换失败，请重试', icon: 'none' })
  }
}

// ── 修改密码 ────────────────────────────────────────────────
function openPwdSheet() {
  pwdForm.value = { old: '', next: '', confirm: '' }
  showPwdSheet.value = true
}
function closePwdSheet() {
  showPwdSheet.value = false
}
async function submitPwd() {
  const { old, next, confirm } = pwdForm.value
  if (!old || !next || !confirm) {
    uni.showToast({ title: '请填写所有字段', icon: 'none' }); return
  }
  if (next.length < 6) {
    uni.showToast({ title: '新密码不能少于6位', icon: 'none' }); return
  }
  if (next !== confirm) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' }); return
  }
  try {
    await put('/api/merchant/password', { oldPassword: old, newPassword: next })
    uni.showToast({ title: '密码修改成功', icon: 'success' })
    showPwdSheet.value = false
  } catch (_) {}
}

// ── 套餐拦截跳转 ────────────────────────────────────────────
function goIfMid(url) {
  if (packageType.value >= 2) {
    uni.navigateTo({ url })
  } else {
    uni.showToast({ title: '该功能仅限中级版及以上使用', icon: 'none', duration: 2000 })
  }
}

function goIfAdv(url) {
  if (packageType.value >= 3) {
    uni.navigateTo({ url })
  } else {
    uni.showToast({ title: '该功能仅限高级版使用', icon: 'none', duration: 2000 })
  }
}

// ── 关于 & 退出 ─────────────────────────────────────────────
function showAbout() {
  uni.showModal({
    title: '智慧客流分析',
    content: '版本 1.0.0\n商家客流智能分析平台',
    showCancel: false,
    confirmText: '知道了'
  })
}

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmText: '退出',
    confirmColor: '#c62828',
    success: ({ confirm }) => {
      if (confirm) {
        logout()
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Header ── */
.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  padding: 0 40rpx 40rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
  }

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 24rpx;

  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50rpx;
    background: rgba(255,255,255,0.2);
    border: 2rpx solid rgba(255,255,255,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 44rpx;
    color: #fff;
    font-weight: 700;
    flex-shrink: 0;
  }

  .profile-info {
    flex: 1;
    min-width: 0;
  }

  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;
  }

  .profile-name {
    font-size: 34rpx;
    font-weight: 700;
    color: #fff;
  }

  .pkg-badge {
    font-size: 18rpx;
    padding: 4rpx 14rpx;
    border-radius: 16rpx;
    font-weight: 600;
    flex-shrink: 0;
    &.badge-basic    { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.85); }
    &.badge-mid      { background: rgba(255,207,64,0.9);  color: #5a3700; }
    &.badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color: #fff; }
  }

  .profile-phone {
    font-size: 24rpx;
    color: rgba(255,255,255,0.55);
  }
}

/* ── Scroll ── */
.scroll-area {
  flex: 1;
  height: 0;
  background: #f4f5f9;
}

/* ── 套餐条 ── */
.pkg-strip {
  margin: 24rpx 32rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

  &:active { opacity: 0.85; }

  .ps-left {
    flex: 1;
    min-width: 0;
  }

  .ps-feature {
    display: block;
    font-size: 26rpx;
    color: #1a1a2e;
    font-weight: 500;
    margin-bottom: 6rpx;
  }

  .ps-expire {
    font-size: 22rpx;
    color: #aaa;
  }

  .ps-upgrade-btn {
    font-size: 24rpx;
    color: #1f4788;
    font-weight: 600;
    flex-shrink: 0;
  }

  .ps-top-tag {
    font-size: 22rpx;
    color: #bbb;
    flex-shrink: 0;
  }
}

/* ── 菜单卡 ── */
.menu-card {
  margin: 16rpx 32rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 0 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  overflow: hidden;
}

.menu-row {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child { border-bottom: none; }
  &:active { background: #f9f9f9; margin: 0 -28rpx; padding: 30rpx 28rpx; }

  .menu-icon {
    font-size: 32rpx;
    margin-right: 18rpx;
    flex-shrink: 0;
    width: 40rpx;
    text-align: center;
  }

  .menu-label {
    font-size: 28rpx;
    color: #1a1a2e;
    flex: 1;
  }

  .menu-val {
    font-size: 26rpx;
    color: #bbb;
    margin-right: 8rpx;
    max-width: 240rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-arrow {
    font-size: 30rpx;
    color: #d0d0d0;
    flex-shrink: 0;
  }
}

.menu-divider {
  height: 1rpx;
  background: #ebebeb;
  margin: 0 -28rpx;
}

/* ── 退出 ── */
.btn-logout {
  display: block;
  margin: 24rpx 32rpx 0;
  width: calc(100% - 64rpx);
  height: 96rpx;
  border-radius: 20rpx;
  background: #fff;
  color: #c62828;
  font-size: 28rpx;
  font-weight: 600;
  border: 1rpx solid #fde0e0;
  line-height: 96rpx;
  box-sizing: border-box;
  padding: 0;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

  &::after { display: none; }
}

.tab-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}

/* ── 弹层表单 ── */
.form {
  .form-row {
    display: flex;
    align-items: center;
    background: #f6f7fa;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;

    .form-label {
      font-size: 26rpx;
      color: #666;
      flex-shrink: 0;
      width: 120rpx;
    }

    .form-input {
      flex: 1;
      font-size: 28rpx;
      color: #1a1a2e;
    }
  }
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  line-height: 96rpx;
  padding: 0;

  &::after { display: none; }
}

/* ── 门店列表 ── */
.store-list {
  .store-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border-radius: 16rpx;
    margin-bottom: 12rpx;
    background: #f6f7fa;

    &.active { background: #e4edfa; border: 1rpx solid #1f4788; }
    &:active { opacity: 0.8; }

    .si-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
    .si-name { font-size: 28rpx; color: #1a1a2e; font-weight: 500; }
    .si-addr { font-size: 22rpx; color: #999; }

    .si-tag {
      font-size: 20rpx;
      color: #1f4788;
      background: rgba(31,71,136,0.12);
      padding: 4rpx 14rpx;
      border-radius: 16rpx;
      font-weight: 600;
      flex-shrink: 0;
    }
  }

  .si-empty {
    text-align: center;
    font-size: 26rpx;
    color: #ccc;
    padding: 32rpx 0;
  }
}

/* ── 升级弹层 ── */
.upgrade-sheet { padding-bottom: 8rpx; }

.us-current {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 28rpx;

  .us-cur-label { font-size: 26rpx; color: #999; }

  .us-cur-badge {
    font-size: 22rpx;
    font-weight: 600;
    padding: 6rpx 18rpx;
    border-radius: 20rpx;
    &.badge-basic    { background: #f0f0f0; color: #999; }
    &.badge-mid      { background: rgba(255,207,64,0.9); color: #5a3700; }
    &.badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color: #fff; }
  }
}

.us-options { display: flex; flex-direction: column; gap: 16rpx; }

.us-tier-card {
  border-radius: 20rpx;
  border: 2rpx solid #e0e7f4;
  padding: 24rpx;

  &--advanced { border-color: rgba(229,46,113,0.25); background: #fffaf8; }

  .us-tier-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .us-tier-badge {
    font-size: 22rpx;
    font-weight: 700;
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    &.badge-mid      { background: rgba(255,207,64,0.9); color: #5a3700; }
    &.badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color: #fff; }
  }

  .us-tier-price { font-size: 30rpx; font-weight: 700; color: #1a1a2e; }

  .us-tier-features { margin-bottom: 20rpx; display: flex; flex-direction: column; gap: 10rpx; }
  .us-feat { font-size: 24rpx; color: #555; line-height: 1.5; }
}

.us-btn {
  width: 100%;
  height: 80rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  font-weight: 600;
  border: none;
  line-height: 80rpx;
  padding: 0;
  background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
  color: #fff;

  &--advanced { background: linear-gradient(135deg, #ff8a00, #e52e71); }
  &::after { display: none; }
}
</style>
