<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">佣金提现</view>
      </view>
    </view>

    <scroll-view
      class="scroll-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 余额卡片 -->
      <view class="balance-card">
        <view class="bc-label">可提现余额</view>
        <view class="bc-amount">¥{{ fmtAmt(profile.balance) }}</view>
        <view class="bc-tip">最低提现 ¥100</view>
        <button class="bc-btn" @click="showWithdrawSheet = true">申请提现</button>
      </view>

      <!-- 四项摘要 -->
      <view class="summary-row">
        <view class="summary-item">
          <view class="si-val">¥{{ fmtAmt(profile.totalCommission) }}</view>
          <view class="si-label">累计佣金</view>
        </view>
        <view class="summary-item">
          <view class="si-val">¥{{ fmtAmt(profile.withdrawnAmount) }}</view>
          <view class="si-label">已打款</view>
        </view>
        <view class="summary-item si-warn">
          <view class="si-val warn">¥{{ fmtAmt(profile.frozenAmount) }}</view>
          <view class="si-label">冻结中</view>
        </view>
        <view class="summary-item">
          <view class="si-val">¥{{ fmtAmt(profile.balance) }}</view>
          <view class="si-label">可提现</view>
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="tab-bar">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'commission' }"
          @click="switchTab('commission')"
        >佣金明细</view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'withdraw' }"
          @click="switchTab('withdraw')"
        >提现记录</view>
      </view>

      <!-- 佣金明细 -->
      <template v-if="activeTab === 'commission'">
        <view v-if="commissionList.length > 0">
          <view
            v-for="item in commissionList"
            :key="item.id"
            class="list-card"
            @click="openMerchantDetail(item)"
          >
            <view class="lc-icon" style="background:#e8f5e9;">💰</view>
            <view class="lc-info">
              <view class="lc-title">{{ item.merchantName || '商家 #' + item.merchantId }}</view>
              <view class="lc-sub">合作时间：{{ formatDate(item.cooperationTime) }}</view>
            </view>
            <view class="lc-right">
              <view class="lc-amount green">+¥{{ fmtAmt(item.earnedCommission) }}</view>
            </view>
          </view>
          <!-- 分页 -->
          <view v-if="commissionTotal > commissionPage * commissionSize" class="load-more" @click="loadMoreCommission">
            加载更多
          </view>
          <view v-else class="no-more">已全部加载</view>
        </view>
        <view v-else class="empty-state">
          <text class="empty-icon">💼</text>
          <text class="empty-title">暂无佣金记录</text>
          <text class="empty-sub">成功推荐商家合作后佣金将显示在这里</text>
        </view>
      </template>

      <!-- 提现记录 -->
      <template v-else>
        <view v-if="withdrawList.length > 0">
          <view
            v-for="record in withdrawList"
            :key="record.id"
            class="list-card"
          >
            <view class="lc-icon" :style="{ background: statusColors[record.status]?.bg || '#f5f5f5' }">💸</view>
            <view class="lc-info">
              <view class="lc-title">提现 ¥{{ fmtAmt(record.amount) }}</view>
              <view class="lc-sub">{{ wayLabel(record.way) }} · {{ record.account }} · {{ formatDate(record.createdAt) }}</view>
              <!-- 驳回原因 -->
              <view v-if="record.status === 2 && record.remark" class="lc-reject-reason">
                驳回原因：{{ record.remark }}
              </view>
            </view>
            <view class="lc-right">
              <view
                class="lc-status"
                :style="{
                  background: statusColors[record.status]?.bg,
                  color: statusColors[record.status]?.color
                }"
              >{{ statusLabel(record.status) }}</view>
            </view>
          </view>
          <!-- 分页 -->
          <view v-if="withdrawTotal > withdrawPage * withdrawSize" class="load-more" @click="loadMoreWithdraw">
            加载更多
          </view>
          <view v-else class="no-more">已全部加载</view>
        </view>
        <view v-else class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-title">暂无提现记录</text>
          <text class="empty-sub">点击「申请提现」发起提现申请</text>
        </view>
      </template>

      <view class="tab-spacer" />
    </scroll-view>

    <TabBar role="salesman" :current="2" />

    <!-- 商家详情弹层 -->
    <BottomSheet :show="showMerchantDetail" title="" @close="showMerchantDetail = false">
      <view v-if="detailMerchant" class="detail-body">
        <view class="detail-hero">
          <view class="detail-hero-info">
            <text class="detail-name">{{ detailMerchant.merchantName }}</text>
            <text class="detail-time">合作时间：{{ formatDate(detailMerchant.cooperationTime) }}</text>
          </view>
          <view class="detail-status-badge">已合作</view>
        </view>
        <view class="detail-section">
          <view class="detail-row" v-if="detailMerchant.contactPerson">
            <text class="dr-label">联系人</text>
            <text class="dr-val">{{ detailMerchant.contactPerson }}</text>
          </view>
          <view class="detail-row" v-if="detailMerchant.contactPhone">
            <text class="dr-label">电话</text>
            <text class="dr-val">{{ detailMerchant.contactPhone }}</text>
          </view>
          <view class="detail-row" v-if="detailMerchant.address">
            <text class="dr-label">地址</text>
            <text class="dr-val">{{ detailMerchant.address }}</text>
          </view>
          <view class="detail-row" v-if="detailMerchant.licenseNo">
            <text class="dr-label">营业执照</text>
            <text class="dr-val">{{ detailMerchant.licenseNo }}</text>
          </view>
          <view class="detail-row" v-if="detailMerchant.commission">
            <text class="dr-label">合作金额</text>
            <text class="dr-val">¥{{ fmtAmt(detailMerchant.commission) }}</text>
          </view>
          <view class="detail-row">
            <text class="dr-label">到账佣金</text>
            <text class="dr-val amount">¥{{ fmtAmt(detailMerchant.earnedCommission) }}</text>
          </view>
        </view>
      </view>
    </BottomSheet>

    <!-- 提现申请弹层 -->
    <BottomSheet :show="showWithdrawSheet" title="申请提现" @close="showWithdrawSheet = false">
      <view class="form">
        <view class="form-hint">
          可提现余额：¥{{ fmtAmt(profile.balance) }}，最低提现 ¥100
        </view>
        <view class="form-item">
          <text class="form-label">提现金额</text>
          <input v-model="withdrawForm.amount" class="form-input" placeholder="不低于 100 元" type="digit" />
        </view>
        <view class="form-item">
          <text class="form-label">提现方式</text>
          <view class="way-picker">
            <view
              class="wp-item"
              :class="{ active: withdrawForm.way === 1 }"
              @click="withdrawForm.way = 1"
            >微信零钱</view>
            <view
              class="wp-item"
              :class="{ active: withdrawForm.way === 2 }"
              @click="withdrawForm.way = 2"
            >银行卡</view>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">{{ withdrawForm.way === 1 ? '微信号' : '银行卡号' }}</text>
          <input v-model="withdrawForm.account" class="form-input" placeholder="请输入收款账号" />
        </view>
        <button class="btn-submit" @click="submitWithdraw">确认申请</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, post } from '../../utils/request.js'

const refreshing = ref(false)
const activeTab  = ref('commission')

const profile = ref({
  totalCommission: 0,
  balance: 0,
  frozenAmount: 0,
  withdrawnAmount: 0
})

// ── 佣金明细 ──
const commissionList  = ref([])
const commissionPage  = ref(1)
const commissionSize  = 10
const commissionTotal = ref(0)

// ── 提现记录 ──
const withdrawList  = ref([])
const withdrawPage  = ref(1)
const withdrawSize  = 10
const withdrawTotal = ref(0)

const showWithdrawSheet = ref(false)
const withdrawForm = ref({ amount: '', way: 1, account: '' })

const showMerchantDetail = ref(false)
const detailMerchant = ref(null)

function openMerchantDetail(item) {
  detailMerchant.value = item
  showMerchantDetail.value = true
}

const statusColors = {
  0: { bg: '#fff3e0', color: '#e65100' },
  1: { bg: '#e8f5e9', color: '#17794a' },
  2: { bg: '#fce4ec', color: '#c62828' }
}

function statusLabel(s) {
  return ['审核中', '已打款', '已驳回'][s] || '未知'
}

function wayLabel(w) {
  return { 1: '微信零钱', 2: '银行卡' }[w] || '微信零钱'
}

function fmtAmt(v) {
  const n = Number(v) || 0
  return n.toFixed(2)
}

function formatDate(dt) {
  if (!dt) return '--'
  const d = new Date(dt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchProfile() {
  try {
    const data = await get('/api/salesman/profile', {}, { showLoad: false })
    profile.value = {
      totalCommission: Number(data.totalCommission) || 0,
      balance:         Number(data.balance)         || 0,
      frozenAmount:    Number(data.frozenAmount)     || 0,
      withdrawnAmount: Number(data.withdrawnAmount)  || 0
    }
  } catch (_) {}
}

async function fetchCommission(reset = false) {
  if (reset) {
    commissionPage.value = 1
    commissionList.value = []
  }
  try {
    const data = await get('/api/salesman/follow/signed', {
      page: commissionPage.value, size: commissionSize
    }, { showLoad: false })
    const items = data.list || data.records || []
    commissionList.value = reset ? items : [...commissionList.value, ...items]
    commissionTotal.value = data.total || 0
  } catch (_) {}
}

async function fetchWithdraw(reset = false) {
  if (reset) {
    withdrawPage.value = 1
    withdrawList.value = []
  }
  try {
    const data = await get('/api/salesman/withdraw/list', {
      page: withdrawPage.value, size: withdrawSize
    }, { showLoad: false })
    const items = data.list || []
    withdrawList.value = reset ? items : [...withdrawList.value, ...items]
    withdrawTotal.value = data.total || 0
  } catch (_) {}
}

async function loadMoreCommission() {
  commissionPage.value++
  await fetchCommission(false)
}

async function loadMoreWithdraw() {
  withdrawPage.value++
  await fetchWithdraw(false)
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'withdraw' && withdrawList.value.length === 0) fetchWithdraw(true)
}

async function submitWithdraw() {
  const amount = parseFloat(withdrawForm.value.amount)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入正确金额', icon: 'none' }); return
  }
  if (amount < 100) {
    uni.showToast({ title: '最低提现金额为 ¥100', icon: 'none' }); return
  }
  if (amount > profile.value.balance) {
    uni.showToast({ title: '超出可提现余额', icon: 'none' }); return
  }
  if (!withdrawForm.value.account) {
    uni.showToast({ title: '请填写收款账号', icon: 'none' }); return
  }
  try {
    await post('/api/salesman/withdraw', {
      amount,
      way:     withdrawForm.value.way,
      account: withdrawForm.value.account
    })
    uni.showToast({ title: '申请已提交', icon: 'success' })
    showWithdrawSheet.value = false
    withdrawForm.value = { amount: '', way: 1, account: '' }
    await Promise.all([fetchProfile(), fetchWithdraw(true)])
    activeTab.value = 'withdraw'
  } catch (e) {
    const msg = e?.data?.message || '申请失败，请重试'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function onRefresh() {
  refreshing.value = true
  await Promise.all([
    fetchProfile(),
    activeTab.value === 'commission' ? fetchCommission(true) : fetchWithdraw(true)
  ])
  refreshing.value = false
  uni.showToast({ title: '已刷新', icon: 'none' })
}

onMounted(async () => {
  await fetchProfile()
  await fetchCommission(true)
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 32rpx 24rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
  }

  .header-title { font-size: 34rpx; font-weight: 600; }
}

.scroll-area { flex: 1; height: 0; background: #f4f5f9; }

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #17794a, #22a965);
  border-radius: 28rpx;
  margin: 32rpx 32rpx 0;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(23, 121, 74, 0.3);
  display: flex;
  flex-direction: column;

  .bc-label  { font-size: 24rpx; color: rgba(255,255,255,.75); margin-bottom: 12rpx; }
  .bc-amount { font-size: 72rpx; font-weight: 700; color: #fff; line-height: 1; margin-bottom: 8rpx; }
  .bc-tip    { font-size: 22rpx; color: rgba(255,255,255,.6); margin-bottom: 20rpx; }
}

.bc-btn {
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 20rpx;
  background: rgba(255,255,255,.25);
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
  border: 2rpx solid rgba(255,255,255,.5);
  padding: 0;
  box-sizing: border-box;
}

/* 四项摘要 */
.summary-row {
  display: flex;
  gap: 12rpx;
  padding: 0 32rpx;
  margin: 20rpx 0 0;

  .summary-item {
    flex: 1;
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx 12rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);

    .si-val   { font-size: 26rpx; font-weight: 700; color: #1a1a2e; }
    .si-label { font-size: 18rpx; color: #999; margin-top: 4rpx; }
    .warn     { color: #e65100; }
  }
}

/* Tab 切换 */
.tab-bar {
  display: flex;
  background: #fff;
  margin: 20rpx 32rpx 0;
  border-radius: 20rpx;
  padding: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);

  .tab-item {
    flex: 1;
    height: 68rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26rpx;
    color: #999;
    border-radius: 16rpx;
    font-weight: 500;

    &.active {
      background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
      color: #fff;
    }
  }
}

/* 列表卡片 */
.list-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  margin: 16rpx 32rpx 0;
  padding: 28rpx 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);

  .lc-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    flex-shrink: 0;
  }

  .lc-info { flex: 1; min-width: 0; }
  .lc-title { font-size: 28rpx; font-weight: 600; color: #1a1a2e; margin-bottom: 6rpx; }
  .lc-sub   { font-size: 22rpx; color: #aaa; }

  .lc-reject-reason {
    font-size: 22rpx;
    color: #c62828;
    margin-top: 8rpx;
    line-height: 1.4;
  }

  .lc-right { flex-shrink: 0; text-align: right; }

  .lc-amount {
    font-size: 30rpx;
    font-weight: 700;
    &.green { color: #17794a; }
  }

  .lc-status {
    font-size: 22rpx;
    padding: 6rpx 18rpx;
    border-radius: 12rpx;
    font-weight: 500;
  }
}

.load-more {
  text-align: center;
  padding: 28rpx;
  font-size: 26rpx;
  color: #1a4a8a;
}

.no-more {
  text-align: center;
  padding: 28rpx;
  font-size: 24rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;

  .empty-icon  { font-size: 96rpx; margin-bottom: 24rpx; opacity: 0.4; }
  .empty-title { font-size: 30rpx; color: #999; font-weight: 500; margin-bottom: 12rpx; }
  .empty-sub   { font-size: 24rpx; color: #ccc; }
}

/* 商家详情弹层 */
.detail-body {
  padding: 0 4rpx 32rpx;
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28rpx;

  .detail-hero-info {
    flex: 1;
    min-width: 0;
  }

  .detail-name {
    display: block;
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 6rpx;
  }

  .detail-time {
    font-size: 24rpx;
    color: #aaa;
  }
}

.detail-status-badge {
  background: #e8f5e9;
  color: #17794a;
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.detail-section {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 8rpx 24rpx;
  margin-bottom: 24rpx;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child { border-bottom: none; }

  .dr-label {
    font-size: 26rpx;
    color: #999;
    width: 140rpx;
    flex-shrink: 0;
  }

  .dr-val {
    flex: 1;
    font-size: 26rpx;
    color: #1a1a2e;
    line-height: 1.5;

    &.amount {
      font-size: 32rpx;
      font-weight: 700;
      color: #17794a;
    }
  }
}

/* 提现方式选择 */
.way-picker {
  display: flex;
  gap: 16rpx;

  .wp-item {
    flex: 1;
    height: 72rpx;
    border-radius: 20rpx;
    background: #f0f0f0;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26rpx;
    font-weight: 500;
    border: 2rpx solid transparent;
    box-sizing: border-box;

    &.active {
      background: #e4edfa;
      color: #1a4a8a;
      border-color: #1a4a8a;
    }
  }
}

.form {
  .form-hint {
    background: #e8f5e9;
    border-radius: 16rpx;
    padding: 18rpx 24rpx;
    font-size: 24rpx;
    color: #17794a;
    margin-bottom: 24rpx;
  }

  .form-item {
    margin-bottom: 28rpx;

    .form-label {
      font-size: 26rpx;
      color: #666;
      display: block;
      margin-bottom: 12rpx;
    }

    .form-input {
      width: 100%;
      height: 88rpx;
      background: #f4f5f9;
      border-radius: 20rpx;
      padding: 0 28rpx;
      font-size: 28rpx;
      color: #333;
      box-sizing: border-box;
    }
  }

  .btn-submit {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    margin-top: 12rpx;
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
  }
}
</style>
