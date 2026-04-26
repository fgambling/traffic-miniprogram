<template>
  <view class="page">
    <!-- Header -->
    <view class="mode-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <text class="header-title">个人业绩统计</text>
      </view>
      <view class="salesman-row">
        <text class="salesman-name">{{ stats.name || userInfo?.nickname || '业务员' }}</text>
        <view class="export-btn" @click="exportExcel">
          <text class="export-text">导出报表</text>
        </view>
      </view>
    </view>

    <scroll-view
      class="scroll-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- ── 4 个统计卡片 ── -->
      <view class="card-grid">
        <view class="stat-card c1" @click="goFollow">
          <view class="sc-val">{{ stats.totalDoneCount }}</view>
          <view class="sc-label">全部签约</view>
          <view class="sc-sub">点击查看列表 ›</view>
        </view>
        <view class="stat-card c2" @click="goFollow">
          <view class="sc-val">{{ stats.monthNewCount }}</view>
          <view class="sc-label">本月新增</view>
          <view class="sc-sub">点击查看列表 ›</view>
        </view>
        <view class="stat-card c3" @click="goCommission">
          <view class="sc-val">¥{{ fmtAmt(stats.pendingCommission) }}</view>
          <view class="sc-label">待结算佣金</view>
          <view class="sc-sub">点击查看明细 ›</view>
        </view>
        <view class="stat-card c4" @click="goCommission">
          <view class="sc-val">¥{{ fmtAmt(stats.monthWithdrawAmount) }}</view>
          <view class="sc-label">本月提现</view>
          <view class="sc-sub">点击查看明细 ›</view>
        </view>
      </view>

      <!-- ── 业绩走势图 ── -->
      <view class="section-card">
        <!-- 图表控制栏 -->
        <view class="chart-toolbar">
          <view class="granularity-tabs">
            <view
              class="gt-item"
              :class="{ active: granularity === 'month' }"
              @click="setGranularity('month')"
            >月度</view>
            <view
              class="gt-item"
              :class="{ active: granularity === 'quarter' }"
              @click="setGranularity('quarter')"
            >季度</view>
          </view>
          <view class="chart-type-switch">
            <view
              class="ct-item"
              :class="{ active: chartType === 'line' }"
              @click="chartType = 'line'"
            >折线</view>
            <view
              class="ct-item"
              :class="{ active: chartType === 'bar' }"
              @click="chartType = 'bar'"
            >柱状</view>
          </view>
        </view>

        <!-- 数据指标切换 -->
        <view class="metric-tabs">
          <view
            class="mt-item"
            :class="{ active: metric === 'sign' }"
            @click="metric = 'sign'"
          >签约数</view>
          <view
            class="mt-item"
            :class="{ active: metric === 'commission' }"
            @click="metric = 'commission'"
          >佣金(元)</view>
        </view>

        <UniChart
          :type="chartType"
          :data="chartData"
          :labels="chartLabels"
          :color="metric === 'sign' ? '#1a4a8a' : '#17794a'"
          :height="200"
          canvas-id="perf-chart"
        />
      </view>

      <!-- ── 签约商家列表 ── -->
      <view class="section-card" id="signed-list">
        <view class="list-header">
          <text class="list-title">签约商家列表</text>
          <text class="list-total">共 {{ signedTotal }} 家</text>
        </view>

        <view v-if="signedList.length > 0">
          <view
            v-for="item in signedList"
            :key="item.id"
            class="signed-item"
          >
            <view class="si-left">
              <view class="si-avatar" :style="{ background: item.avatarBg }">
                <text>{{ item.icon }}</text>
              </view>
              <view class="si-info">
                <text class="si-name">{{ item.merchantName || '—' }}</text>
                <text class="si-meta">{{ item.contactPerson }} · {{ fmtDate(item.cooperationTime) }}</text>
              </view>
            </view>
            <view class="si-right">
              <text class="si-commission">¥{{ fmtAmt(item.earnedCommission) }}</text>
              <text class="si-label">佣金</text>
            </view>
          </view>
        </view>
        <view v-else class="list-empty">暂无签约商家</view>

        <!-- 分页 -->
        <view v-if="signedPages > 1" class="pagination">
          <view
            class="page-btn"
            :class="{ disabled: signedPage === 1 }"
            @click="changePage(signedPage - 1)"
          >上一页</view>
          <text class="page-info">{{ signedPage }} / {{ signedPages }}</text>
          <view
            class="page-btn"
            :class="{ disabled: signedPage === signedPages }"
            @click="changePage(signedPage + 1)"
          >下一页</view>
        </view>
      </view>


      <view class="tab-spacer" />
    </scroll-view>



    <TabBar role="salesman" :current="0" />
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import UniChart from '../../components/UniChart.vue'
import { useUserStore } from '../../store/user.js'
import { statusBarHeight } from '../../utils/system.js'
import { get, BASE_URL } from '../../utils/request.js'
import { getToken } from '../../utils/auth.js'

const { state } = useUserStore()
const userInfo = state.userInfo

// ── 状态 ────────────────────────────────────────────────────
const refreshing  = ref(false)
const granularity = ref('month')   // month | quarter
const chartType   = ref('line')    // line | bar
const metric      = ref('sign')    // sign | commission

const stats = ref({
  name: '', monthSignCount: 0, monthNewCount: 0,
  pendingCommission: 0, monthWithdrawAmount: 0,
  totalCommission: 0, balance: 0,
  followingCount: 0, totalDoneCount: 0, lostCount: 0
})

const trendData   = ref([])   // [{period, signCount, commission}, ...]
const signedList  = ref([])
const signedTotal = ref(0)
const signedPage  = ref(1)
const signedPages = ref(1)
const PAGE_SIZE   = 10

// ── 图表数据 ─────────────────────────────────────────────────
const chartLabels = computed(() =>
  trendData.value.map(d => {
    // yyyy-MM → M月 ; yyyyQn → Qn
    if (d.period.includes('-')) {
      const m = parseInt(d.period.split('-')[1])
      return `${m}月`
    }
    return d.period.slice(4)   // Q1 / Q2 ...
  })
)

const chartData = ref([])

// metric 或 trendData 任一变化时重算图表数据
watch(
  [metric, trendData],
  ([m, td]) => {
    chartData.value = m === 'sign'
      ? td.map(d => Number(d.signCount) || 0)
      : td.map(d => Number(d.commission) || 0)
  },
  { immediate: true, deep: true }
)

// 头像颜色池
const iconPool  = ['🏪', '🍜', '☕', '🌸', '🥗', '👟', '💄', '🍰', '📱', '🏋️']
const colorPool = [
  { bg: '#fff3e0' }, { bg: '#e4edfa' }, { bg: '#fce4ec' },
  { bg: '#e8f5e9' }, { bg: '#f3e5f5' }, { bg: '#e0f7fa' }
]

// ── 数据加载 ─────────────────────────────────────────────────
async function loadSummary() {
  try {
    const data = await get('/api/salesman/performance/summary', {}, { showLoad: false })
    stats.value = {
      name:                data.name || '',
      monthSignCount:      data.monthSignCount      || 0,
      monthNewCount:       data.monthNewCount        || 0,
      pendingCommission:   data.pendingCommission    || 0,
      monthWithdrawAmount: data.monthWithdrawAmount  || 0,
      totalCommission:     data.totalCommission      || 0,
      balance:             data.balance              || 0,
      followingCount:      data.followingCount       || 0,
      totalDoneCount:      data.totalDoneCount       || 0,
      lostCount:           data.lostCount            || 0
    }
  } catch (_) {}
}

async function loadTrend() {
  try {
    trendData.value = await get('/api/salesman/performance/trend',
      { granularity: granularity.value }, { showLoad: false }) || []
  } catch (_) {}
}

async function loadSignedList(page = 1) {
  try {
    const res = await get('/api/salesman/follow/signed',
      { page, size: PAGE_SIZE }, { showLoad: false })
    signedList.value = (res.list || []).map((vo, i) => ({
      ...vo,
      icon:     iconPool[i % iconPool.length],
      avatarBg: colorPool[i % colorPool.length].bg
    }))
    signedTotal.value = res.total || 0
    signedPage.value  = res.page  || 1
    signedPages.value = res.pages || 1
  } catch (_) {}
}

async function loadAll() {
  await Promise.all([loadSummary(), loadTrend(), loadSignedList(1)])
}

onMounted(loadAll)

// ── 交互 ─────────────────────────────────────────────────────
async function setGranularity(val) {
  granularity.value = val
  await loadTrend()
}

async function changePage(p) {
  if (p < 1 || p > signedPages.value) return
  await loadSignedList(p)
}

async function onRefresh() {
  refreshing.value = true
  await loadAll()
  refreshing.value = false
  uni.showToast({ title: '已刷新', icon: 'none' })
}

function exportExcel() {
  uni.showLoading({ title: '生成中...' })
  const token = getToken()

  uni.request({
    url: `${BASE_URL}/api/salesman/performance/export`,
    method: 'GET',
    header: { Authorization: `Bearer ${token}` },
    success: (res) => {
      uni.hideLoading()
      const fileUrl = res.data?.data?.url
      if (!fileUrl) { uni.showToast({ title: '导出失败', icon: 'none' }); return }
      // 下载并打开
      uni.downloadFile({
        url: `${BASE_URL}${fileUrl}`,
        header: { Authorization: `Bearer ${token}` },
        success: ({ tempFilePath }) => {
          uni.openDocument({
            filePath: tempFilePath,
            fileType: 'xlsx',
            showMenu: true,
            fail: () => {
              uni.showModal({
                title: '文件已生成',
                content: '无法自动打开，请在浏览器访问：' + BASE_URL + fileUrl,
                showCancel: false
              })
            }
          })
        },
        fail: () => uni.showToast({ title: '下载失败', icon: 'none' })
      })
    },
    fail: () => { uni.hideLoading(); uni.showToast({ title: '请求失败', icon: 'none' }) }
  })
}

// ── 工具 ─────────────────────────────────────────────────────
function fmtAmt(val) {
  const n = Number(val) || 0
  return n.toFixed(2)
}

function fmtDate(dt) {
  if (!dt) return '--'
  const d = new Date(dt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goFollow()     { uni.redirectTo({ url: '/pages/salesman/follow' }) }
function goCommission() { uni.redirectTo({ url: '/pages/salesman/commission' }) }
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Header ── */
.mode-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 32rpx 28rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-size: 34rpx;
    font-weight: 700;
  }

  .salesman-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2rpx;
  }

  .salesman-name {
    font-size: 24rpx;
    opacity: 0.65;
  }

  .export-btn {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 20rpx;
    padding: 8rpx 24rpx;

    &:active { opacity: 0.7; }

    .export-text { font-size: 24rpx; font-weight: 600; color: #fff; }
  }
}

.scroll-area {
  flex: 1;
  height: 0;
  background: #f4f5f9;
}

/* ── 4 卡片网格 ── */
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 28rpx 32rpx 0;
}

.stat-card {
  border-radius: 24rpx;
  padding: 28rpx 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);

  &:active { opacity: 0.85; }

  .sc-val {
    font-size: 44rpx;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    margin-bottom: 10rpx;
  }

  .sc-label {
    font-size: 24rpx;
    color: rgba(255,255,255,0.85);
    font-weight: 600;
    margin-bottom: 6rpx;
  }

  .sc-sub {
    font-size: 20rpx;
    color: rgba(255,255,255,0.55);
  }

  &.c1 { background: linear-gradient(135deg, #1a4a8a, #2d6fd6); }
  &.c2 { background: linear-gradient(135deg, #17794a, #22a965); }
  &.c3 { background: linear-gradient(135deg, #7b1fa2, #ab47bc); }
  &.c4 { background: linear-gradient(135deg, #e65100, #ff7043); }
}

/* ── 通用卡片容器 ── */
.section-card {
  background: #fff;
  border-radius: 24rpx;
  margin: 24rpx 32rpx 0;
  padding: 28rpx 28rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

/* ── 图表工具栏 ── */
.chart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.granularity-tabs,
.chart-type-switch {
  display: flex;
  background: #f0f2f5;
  border-radius: 16rpx;
  padding: 4rpx;
  gap: 4rpx;
}

.gt-item,
.ct-item {
  padding: 10rpx 24rpx;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #999;
  font-weight: 500;
  transition: all 0.2s;

  &.active {
    background: #fff;
    color: #1a4a8a;
    font-weight: 700;
    box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.1);
  }
}

/* ── 指标 Tab ── */
.metric-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;

  .mt-item {
    font-size: 24rpx;
    color: #bbb;
    padding-bottom: 8rpx;
    border-bottom: 3rpx solid transparent;

    &.active {
      color: #1a4a8a;
      border-bottom-color: #1a4a8a;
      font-weight: 700;
    }
  }
}

/* ── 签约商家列表 ── */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .list-title { font-size: 28rpx; font-weight: 700; color: #1a1a2e; }
  .list-total { font-size: 22rpx; color: #aaa; }
}

.signed-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child { border-bottom: none; }

  .si-left {
    display: flex;
    align-items: center;
    gap: 18rpx;
    flex: 1;
    min-width: 0;
  }

  .si-avatar {
    width: 72rpx;
    height: 72rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34rpx;
    flex-shrink: 0;
  }

  .si-info {
    min-width: 0;
    .si-name {
      display: block;
      font-size: 28rpx;
      font-weight: 600;
      color: #1a1a2e;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .si-meta { font-size: 22rpx; color: #aaa; margin-top: 4rpx; }
  }

  .si-right {
    flex-shrink: 0;
    text-align: right;
    .si-commission { display: block; font-size: 30rpx; font-weight: 700; color: #17794a; }
    .si-label { font-size: 20rpx; color: #aaa; }
  }
}

.list-empty {
  text-align: center;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #ccc;
}

/* ── 分页 ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  padding-top: 24rpx;

  .page-btn {
    font-size: 26rpx;
    color: #1a4a8a;
    padding: 10rpx 28rpx;
    background: #e4edfa;
    border-radius: 16rpx;
    font-weight: 600;

    &.disabled { color: #ccc; background: #f5f5f5; pointer-events: none; }
  }

  .page-info { font-size: 24rpx; color: #999; }
}


</style>
