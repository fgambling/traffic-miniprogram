<template>
  <view class="page">
    <!-- Header -->
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">我的</view>
      </view>
      <view class="avatar-area">
        <view class="avatar">{{ avatarText }}</view>
        <view class="user-info">
          <text class="user-name">{{ storeName }}</text>
          <text class="user-phone">{{ phone || '未绑定手机号' }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- 套餐信息 -->
      <view class="section-title">套餐信息</view>
      <view class="pkg-card">
        <view class="pkg-header">
          <text class="pkg-name">{{ pkgName }}</text>
          <view class="pkg-badge" :class="pkgBadgeClass">{{ pkgBadgeText }}</view>
        </view>
        <view class="pkg-rows">
          <view class="pkg-row">
            <text class="pkg-label">有效期至</text>
            <text class="pkg-val">{{ pkgExpire }}</text>
          </view>
          <view class="pkg-row">
            <text class="pkg-label">AI经营建议</text>
            <text class="pkg-val">{{ aiFeature }}</text>
          </view>
        </view>
        <button
          v-if="packageType < 3"
          class="pkg-upgrade-btn"
          @click="showUpgradeSheet = true"
        >升级</button>
        <view v-else class="pkg-top-hint">已是最高版本</view>
      </view>

      <!-- 门店管理：仅多门店时展示 -->
      <template v-if="hasMultiStore">
        <view class="section-title">门店管理</view>
        <view class="menu-card">
          <view class="menu-row" @click="showStoreSheet = true">
            <text class="menu-label">切换门店</text>
            <text class="menu-val">{{ storeName }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </template>

      <!-- 账号设置 -->
      <view class="section-title">账号设置</view>
      <view class="menu-card">
        <view class="menu-row" @click="showPhoneSheet = true">
          <text class="menu-label">绑定手机号</text>
          <text class="menu-val">{{ phoneMasked }}</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-row" @click="openPwdSheet">
          <text class="menu-label">修改密码</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-row" @click="showAbout">
          <text class="menu-label">关于系统</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-wrap">
        <button class="btn-logout" @click="confirmLogout">退出登录</button>
      </view>

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
              <text class="us-feat">✓ AI 大模型个性化建议（即将上线）</text>
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
  if (packageType.value === 1) return '3 次/天（规则建议）'
  if (packageType.value === 2) return '无限次（规则建议）'
  return '无限次（含大模型，即将上线）'
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
const hasMultiStore = computed(() => storeList.value.length > 1)
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

// ── 绑定手机号 ──────────────────────────────────────────────
function savePhone() {
  const val = phoneInput.value.trim()
  if (!/^1\d{10}$/.test(val)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' }); return
  }
  phone.value = val
  showPhoneSheet.value = false
  uni.showToast({ title: '绑定成功', icon: 'success' })
}

// ── 切换门店 ────────────────────────────────────────────────
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

/* Header */
.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  padding: 0 40rpx 48rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
  }

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  .avatar-area {
    display: flex;
    align-items: center;
    gap: 28rpx;
  }

  .avatar {
    width: 112rpx;
    height: 112rpx;
    border-radius: 56rpx;
    background: rgba(255, 255, 255, 0.2);
    border: 3rpx solid rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52rpx;
    color: #fff;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-info {
    .user-name {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .user-phone {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}

.scroll-area {
  flex: 1;
  height: 0;
  background: #f4f5f9;
}

.section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #999;
  padding: 32rpx 32rpx 12rpx;
  letter-spacing: 1rpx;
}

/* 套餐卡片 */
.pkg-card {
  background: #fff;
  margin: 0 32rpx;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .pkg-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;

    .pkg-name {
      font-size: 34rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .pkg-badge {
      font-size: 20rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      font-weight: 600;
    }

    .badge-basic    { background: #f0f0f0; color: #999; }
    .badge-mid      { background: rgba(255,207,64,0.9); color: #5a3700; }
    .badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color: #fff; }
  }

  .pkg-rows {
    margin-bottom: 24rpx;
  }

  .pkg-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14rpx 0;

    .pkg-label {
      font-size: 26rpx;
      color: #999;
    }

    .pkg-val {
      font-size: 26rpx;
      color: #1a1a2e;
      font-weight: 500;
    }
  }

  .pkg-upgrade-btn {
    width: 100%;
    height: 80rpx;
    border-radius: 20rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 26rpx;
    font-weight: 600;
    border: none;
    line-height: 80rpx;
    padding: 0;
  }

  .pkg-top-hint {
    text-align: center;
    font-size: 24rpx;
    color: #bbb;
    padding: 16rpx 0 4rpx;
  }
}

/* 菜单卡 */
.menu-card {
  background: #fff;
  margin: 0 32rpx;
  border-radius: 24rpx;
  padding: 0 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .menu-row {
    display: flex;
    align-items: center;
    padding: 28rpx 0;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child { border-bottom: none; }
    &:active { opacity: 0.7; }

    .menu-label {
      font-size: 28rpx;
      color: #1a1a2e;
      flex-shrink: 0;
    }

    .menu-val {
      flex: 1;
      text-align: right;
      font-size: 26rpx;
      color: #999;
      margin-right: 8rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-arrow {
      font-size: 32rpx;
      color: #ccc;
      flex-shrink: 0;
    }
  }
}

/* 退出 */
.logout-wrap {
  padding: 48rpx 32rpx 0;

  .btn-logout {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: #fff;
    color: #c62828;
    font-size: 30rpx;
    font-weight: 600;
    border: 1rpx solid #fde0e0;
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
  }
}

.tab-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}

/* 弹层表单 */
.form {
  .form-row {
    display: flex;
    align-items: center;
    background: #f6f7fa;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;

    .form-label {
      font-size: 26rpx;
      color: #666;
      flex-shrink: 0;
      margin-right: 16rpx;
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
}

/* 门店列表 */
.store-list {
  .store-item {
    display: flex;
    align-items: center;
    padding: 28rpx 24rpx;
    border-radius: 16rpx;
    margin-bottom: 12rpx;
    background: #f6f7fa;

    &.active {
      background: #e4edfa;
      border: 1rpx solid #1f4788;
    }

    &:active { opacity: 0.8; }

    .si-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6rpx;
    }

    .si-name {
      font-size: 28rpx;
      color: #1a1a2e;
      font-weight: 500;
    }

    .si-addr {
      font-size: 22rpx;
      color: #999;
    }

    .si-tag {
      font-size: 20rpx;
      color: #1f4788;
      background: rgba(31, 71, 136, 0.15);
      padding: 4rpx 14rpx;
      border-radius: 16rpx;
      font-weight: 600;
      flex-shrink: 0;
    }
  }
}

.empty-hint {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #ccc;
}

/* 升级弹层 */
.upgrade-sheet {
  padding-bottom: 8rpx;
}

.us-current {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 32rpx;

  .us-cur-label {
    font-size: 26rpx;
    color: #999;
  }

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

.us-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.us-tier-card {
  border-radius: 20rpx;
  border: 2rpx solid #e0e7f4;
  padding: 28rpx;

  &--advanced {
    border-color: rgba(229,46,113,0.3);
    background: rgba(255,250,245,1);
  }

  .us-tier-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18rpx;
  }

  .us-tier-badge {
    font-size: 22rpx;
    font-weight: 700;
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    &.badge-mid      { background: rgba(255,207,64,0.9); color: #5a3700; }
    &.badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color: #fff; }
  }

  .us-tier-price {
    font-size: 30rpx;
    font-weight: 700;
    color: #1a1a2e;
  }

  .us-tier-features {
    margin-bottom: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
  }

  .us-feat {
    font-size: 24rpx;
    color: #555;
    line-height: 1.5;
  }
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

  &--advanced {
    background: linear-gradient(135deg, #ff8a00, #e52e71);
  }
}
</style>
