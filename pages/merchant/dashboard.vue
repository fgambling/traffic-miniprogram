<template>
  <view class="page">
    <!-- ===== Header ===== -->
    <view class="hero-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="store-name">
          <text>{{ storeName }}</text>
        </view>
        <view class="top-right-group">
          <view class="top-right" @click="showStoreSheet = true">
            <text class="switch-text">切换</text>
          </view>
          <view class="top-right dev-logout" @click="devLogout">
            <text class="switch-text">退出</text>
          </view>
        </view>
      </view>

      <!-- 核心数字 -->
      <view class="hero-number">
        <view class="hero-label">今日进店客流</view>
        <view class="hero-val">{{ stat.todayCount }}</view>
        <view class="hero-delta" :class="stat.deltaPercent >= 0 ? 'delta-up' : 'delta-down'">
          <text>较昨日 {{ stat.deltaPercent >= 0 ? '+' : '' }}{{ stat.deltaPercent }}%</text>
        </view>
      </view>

      <!-- 3 格小指标 -->
      <view class="sub-metrics">
        <view class="sub-metric">
          <view class="sm-val">{{ stat.currentInStore }}</view>
          <view class="sm-label">当前在店</view>
        </view>
        <view class="sub-metric border-x">
          <view class="sm-val">{{ stat.entryRate }}<text class="sm-unit">%</text></view>
          <view class="sm-label">进店率</view>
        </view>
        <view class="sub-metric">
          <view class="sm-val">{{ stat.avgStay }}</view>
          <view class="sm-label">平均停留</view>
        </view>
      </view>
    </view>

    <!-- ===== 滚动内容 ===== -->
    <scroll-view class="scroll-area" scroll-y enable-flex>

      <!-- 高峰提醒滚动消息栏 -->
      <view v-if="peakMessage" class="peak-banner" @click="onPeakBannerClick">
        <text class="peak-icon">🔔</text>
        <view class="marquee-wrap">
          <text class="marquee-text">{{ peakMessage }}</text>
        </view>
        <text class="peak-arrow">›</text>
      </view>

      <!-- 性别分布 + 年龄段（上下叠放，各占满宽） -->
      <view class="pad">
        <!-- 性别分布（纯HTML，不用canvas，弹层出现时不消失） -->
        <view class="mini-card">
          <view class="mini-title">性别分布</view>

          <!-- 双色环形视觉 + tooltip（点击显示人数，再点关闭） -->
          <view class="gender-ring-area" @click="toggleGenderCount">
            <!-- tooltip 浮在环形图正上方 -->
            <view v-if="showGenderCount" class="tip-float">
              <view class="tip-box">
                <text class="tip-text">男 {{ stat.genderMaleCount }}人</text>
                <text class="tip-text tip-divider">·</text>
                <text class="tip-text">女 {{ stat.genderFemaleCount }}人</text>
              </view>
              <view class="tip-arrow" />
            </view>
            <view class="gender-ring-wrap">
              <view class="gender-ring" :style="genderRingStyle">
              </view>
              <view class="gender-hole">
                <text class="gender-hole-label">{{ genderCenterLabel }}</text>
              </view>
            </view>
          </view>

          <!-- 图例 -->
          <view class="donut-legend">
            <view class="dl-item">
              <view class="dl-dot" style="background:#2a5298;" />
              <text class="dl-label">男 {{ stat.malePercent }}%</text>
            </view>
            <view class="dl-item">
              <view class="dl-dot" style="background:#d64a7a;" />
              <text class="dl-label">女 {{ 100 - stat.malePercent }}%</text>
            </view>
          </view>
        </view>

        <!-- 年龄 -->
        <view class="mini-card" style="margin-top: 20rpx;">
          <view class="mini-title">年龄段</view>
          <view class="age-bars">
            <view v-for="(ag, i) in ageData" :key="ag.label" class="age-col" @click="onAgeClick(i)">
              <!-- tooltip 浮在柱体正上方，与客流趋势点击样式一致 -->
              <view v-if="activeAgeIdx === i" class="tip-float age-tip-float">
                <view class="tip-box">
                  <text class="tip-text">{{ ag.count }}人</text>
                </view>
                <view class="tip-arrow" />
              </view>
              <text class="age-pct" :style="{ color: ag.color, opacity: activeAgeIdx === i ? 0 : 1 }">{{ ag.pct }}%</text>
              <view class="age-fill" :style="{ height: ag.barH + 'rpx', background: ag.color }" />
              <text class="age-label">{{ ag.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 客流趋势柱状图 -->
      <view class="card mx-pad">
        <view class="card-header">
          <text class="card-title">今日客流趋势</text>
          <text class="card-more" @click="goTrend">详情 ›</text>
        </view>
        <UniChart
          v-if="!anySheetOpen"
          canvas-id="chart-dashboard"
          type="bar"
          :data="hourlyData"
          :labels="hourlyLabels"
          :height="280"
          :peak-threshold="hourlyPeak"
        />
        <view v-else class="chart-placeholder" :style="{ height: '280rpx' }" />
      </view>

      <!-- 快捷入口 -->
      <view class="card mx-pad quick-card">
        <view class="quick-grid">
          <view class="quick-item" @click="goTrend">
            <view class="qi-icon" style="background:#e4edfa;">📊</view>
            <text class="qi-label">客流趋势</text>
          </view>
          <view class="quick-item" @click="goAI">
            <view class="qi-icon" style="background:#e8f5e9;">💡</view>
            <text class="qi-label">AI建议</text>
          </view>
          <view class="quick-item" @click="goMine">
            <view class="qi-icon" style="background:#fff3e0;">⚙️</view>
            <text class="qi-label">我的</text>
          </view>
          <view class="quick-item" @click="doRefresh">
            <view class="qi-icon" style="background:#fce4ec;">🔄</view>
            <text class="qi-label">立即刷新</text>
          </view>
        </view>
      </view>

      <!-- 数据来源 -->
      <view class="data-source">数据来源：26维性解析</view>

      <view class="tab-spacer" />
    </scroll-view>

    <!-- Tab Bar -->
    <TabBar role="merchant" :current="0" />

    <!-- 切换门店弹层 -->
    <BottomSheet :show="showStoreSheet" title="切换门店" @close="showStoreSheet = false">
      <view
        v-for="s in stores"
        :key="s.id"
        class="store-item"
        @click="selectStore(s)"
      >
        <view style="flex:1; min-width:0; overflow:hidden;">
          <view style="font-size:28rpx; font-weight:600; color:#1a1a2e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ s.name }}</view>
          <view style="font-size:22rpx; color:#999; margin-top:4rpx;">{{ s.cameraInfo }}</view>
        </view>
        <view v-if="s.id === currentStoreId" class="current-badge">当前</view>
      </view>
    </BottomSheet>

    <!-- 分钟曲线弹层 -->
    <BottomSheet :show="showMinuteSheet" :title="minuteSheetTitle" @close="showMinuteSheet = false">
      <view style="padding: 0 0 24rpx;">
        <UniChart
          v-if="showMinuteSheet"
          canvas-id="chart-minute"
          type="line"
          :data="minuteData"
          :labels="minuteLabels"
          :height="300"
        />
        <view v-if="minuteData.length === 0" class="empty-tip">该时段暂无分钟级数据</view>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import UniChart from '../../components/UniChart.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get } from '../../utils/request.js'
import { useUserStore } from '../../store/user.js'

// ── 状态 ──────────────────────────────────────────────────────
const stat = ref({
  todayCount: 0,
  deltaPercent: 0,
  currentInStore: 0,
  entryRate: 0,
  avgStay: 0,
  malePercent: 50,
  genderMaleCount: 0,
  genderFemaleCount: 0
})

const showGenderCount = ref(false)
const activeAgeIdx    = ref(-1)

const hourlyData   = ref([])
const hourlyLabels = ref([])
const hourlyPeak   = ref(10)

const ageData = ref([
  { label: '<18',   pct: 0, color: '#e8842a', barH: 0 },
  { label: '18-60', pct: 0, color: '#2d6fd6', barH: 0 },
  { label: '>60',   pct: 0, color: '#9556cc', barH: 0 }
])

const storeName     = ref('加载中...')
const currentStoreId = ref('')
const stores        = ref([])

const showStoreSheet  = ref(false)
const showMinuteSheet = ref(false)
const minuteSheetTitle = ref('')
const minuteData      = ref([])
const minuteLabels    = ref([])

const anySheetOpen = computed(() => showStoreSheet.value || showMinuteSheet.value)

// ── 性别 CSS 环形图 ──────────────────────────────────────────
// 男性百分比→旋转角度：50% = 0deg（左半蓝），超过50%顺时针转
const genderRingStyle = computed(() => ({
  background: `conic-gradient(#2a5298 0% ${stat.value.malePercent}%, #d64a7a ${stat.value.malePercent}% 100%)`
}))

const genderCenterLabel = computed(() =>
  stat.value.malePercent > 50 ? '男多' : stat.value.malePercent < 50 ? '女多' : '均等'
)

// ── 高峰消息计算 ──────────────────────────────────────────────
const peakHourInfo = computed(() => {
  if (!hourlyData.value.length) return null
  const maxVal = Math.max(...hourlyData.value)
  if (maxVal === 0) return null
  const idx = hourlyData.value.indexOf(maxVal)
  const label = hourlyLabels.value[idx] ?? String(idx)
  return { label, count: maxVal, idx }
})

const peakMessage = computed(() => {
  if (!peakHourInfo.value) return ''
  const h = peakHourInfo.value.label
  const n = peakHourInfo.value.count
  return `${h}:00 - ${h}:59 进店 ${n} 人，为今日当前高峰 · 点击查看分钟曲线`
})

// ── 工具函数 ─────────────────────────────────────────────────
function formatStay(seconds) {
  if (!seconds) return '0min'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m${s}s` : `${m}min`
}

function computeAgeData(raw) {
  const c1 = raw.ageUnder18 || 0
  const c2 = raw.age1860    || 0
  const c3 = raw.ageOver60  || 0
  const total = c1 + c2 + c3
  if (total === 0) return ageData.value
  const pct1 = Math.round((c1 / total) * 100)
  const pct2 = Math.round((c2 / total) * 100)
  const pct3 = 100 - pct1 - pct2
  const maxPct = Math.max(pct1, pct2, pct3, 1)
  return [
    { label: '<18',   pct: pct1, count: c1, color: '#e8842a', barH: Math.round((pct1 / maxPct) * 120) },
    { label: '18-60', pct: pct2, count: c2, color: '#2d6fd6', barH: Math.round((pct2 / maxPct) * 120) },
    { label: '>60',   pct: pct3, count: c3, color: '#9556cc', barH: Math.round((pct3 / maxPct) * 120) }
  ]
}

// ── 数据拉取 ─────────────────────────────────────────────────
async function fetchDashboard() {
  try {
    const data = await get('/api/merchant/dashboard', {}, { showLoad: false })
    const total = (data.genderMale || 0) + (data.genderFemale || 0)
    const maleP = total > 0 ? Math.round((data.genderMale / total) * 100) : 50
    storeName.value = data.merchantName || '我的门店'
    stat.value = {
      todayCount:    data.totalEnter     || 0,
      deltaPercent:  data.deltaPercent   ?? 0,
      currentInStore: data.currentInStore || 0,
      entryRate:     data.totalPass > 0
        ? Math.round((data.totalEnter / (data.totalEnter + data.totalPass)) * 100)
        : 0,
      avgStay:  formatStay(data.avgStaySeconds || 0),
      malePercent: maleP,
      genderMaleCount:   data.genderMale   || 0,
      genderFemaleCount: data.genderFemale || 0
    }
    ageData.value = computeAgeData(data)
  } catch (e) {
    // 保持默认值
  }
}

async function fetchHourlyTrend() {
  try {
    const points = await get('/api/merchant/trend', { type: 'hour' }, { showLoad: false })
    if (!Array.isArray(points) || points.length === 0) return
    const counts = points.map(p => p.enterCount || 0)
    hourlyData.value   = counts
    hourlyLabels.value = points.map(p => {
      const parts = (p.timeLabel || '').split(' ')
      return parts[1] ? parts[1].substring(0, 2) : p.timeLabel
    })
    const avg = counts.reduce((s, v) => s + v, 0) / (counts.length || 1)
    hourlyPeak.value = Math.max(10, Math.round(avg * 1.3))
  } catch (e) {
    // 图表留空
  }
}

async function fetchAll() {
  await Promise.all([fetchDashboard(), fetchHourlyTrend()])
}

// ── 分钟曲线 ─────────────────────────────────────────────────
async function onPeakBannerClick() {
  const info = peakHourInfo.value
  if (!info) return
  const h = Number(info.label)
  if (isNaN(h)) return

  const today = new Date()
  const pad = n => String(n).padStart(2, '0')
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  minuteSheetTitle.value = `${info.label}:00 - ${info.label}:59 分钟客流`
  minuteData.value   = []
  minuteLabels.value = []
  showMinuteSheet.value = true

  // 等待BottomSheet动画完成(300ms)后再赋数据，避免canvas挂载时动画未完成导致超时
  await new Promise(resolve => setTimeout(resolve, 420))
  if (!showMinuteSheet.value) return  // 用户已关闭

  try {
    // 用 date + hour 两个简单参数，避免 ISO 时间戳 URL 编码(:→%3A)导致 Spring 解析失败
    const points = await get('/api/merchant/trend', {
      type: 'minute', date: dateStr, hour: h
    }, { showLoad: false })
    if (Array.isArray(points) && points.length) {
      minuteData.value   = points.map(p => p.enterCount || 0)
      // timeLabel 格式: "2026-04-19 12:05:00" → 取 "12:05"
      minuteLabels.value = points.map(p => {
        const parts = (p.timeLabel || '').split(' ')
        return parts[1] ? parts[1].substring(0, 5) : ''
      })
    }
  } catch (e) {
    // 保持空
  }
}

// ── 自动刷新 ─────────────────────────────────────────────────
let refreshTimer = null

onMounted(() => {
  fetchAll()
  refreshTimer = setInterval(fetchAll, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// ── 操作 ─────────────────────────────────────────────────────
function selectStore(s) {
  currentStoreId.value = s.id
  storeName.value      = s.name
  showStoreSheet.value = false
  fetchAll()
}

function doRefresh() {
  fetchAll()
  uni.showToast({ title: '已刷新', icon: 'success', duration: 1000 })
}

function goTrend()  { uni.redirectTo({ url: '/pages/merchant/trend' }) }
function goAI()     { uni.redirectTo({ url: '/pages/merchant/ai-advice' }) }
function goMine()   { uni.redirectTo({ url: '/pages/merchant/mine' }) }

function devLogout() {
  const { logout } = useUserStore()
  logout()
  uni.reLaunch({ url: '/pages/login/login' })
}

function toggleGenderCount() {
  showGenderCount.value = !showGenderCount.value
}

function onAgeClick(i) {
  activeAgeIdx.value = activeAgeIdx.value === i ? -1 : i
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ===== Hero Header ===== */
.hero-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 40rpx 32rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 200rpx;
    margin-bottom: 8rpx;

    .store-name {
      font-size: 30rpx;
      font-weight: 600;
      opacity: 0.95;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .top-right-group {
      display: flex;
      gap: 12rpx;
      flex-shrink: 0;
    }

    .top-right {
      padding: 8rpx 24rpx;
      background: rgba(255, 255, 255, 0.14);
      border-radius: 24rpx;
      flex-shrink: 0;

      .switch-text { font-size: 22rpx; opacity: 0.9; }
      &:active { opacity: 0.75; }

      &.dev-logout { background: rgba(200, 40, 40, 0.3); }
    }
  }

  .hero-number {
    text-align: center;
    padding: 8rpx 0 16rpx;

    .hero-label {
      font-size: 22rpx;
      opacity: 0.6;
      letter-spacing: 2rpx;
    }

    .hero-val {
      font-size: 112rpx;
      font-weight: 700;
      letter-spacing: -4rpx;
      line-height: 1.1;
      margin: 12rpx 0 8rpx;
    }

    .hero-delta {
      display: inline-flex;
      align-items: center;
      gap: 8rpx;
      padding: 6rpx 24rpx;
      border-radius: 40rpx;
      font-size: 22rpx;

      &.delta-up   { background: rgba(23, 121, 74, 0.35); }
      &.delta-down { background: rgba(200, 50, 50, 0.35); }
    }
  }

  .sub-metrics {
    display: flex;
    margin-top: 32rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 24rpx;
    padding: 24rpx 0;

    .sub-metric {
      flex: 1;
      text-align: center;

      .sm-val {
        font-size: 44rpx;
        font-weight: 700;
        .sm-unit { font-size: 24rpx; font-weight: 500; }
      }

      .sm-label {
        font-size: 20rpx;
        opacity: 0.55;
        margin-top: 4rpx;
      }

      &.border-x {
        border-left: 1rpx solid rgba(255, 255, 255, 0.1);
        border-right: 1rpx solid rgba(255, 255, 255, 0.1);
      }
    }
  }
}

/* ===== Scroll area ===== */
.scroll-area {
  flex: 1;
  min-height: 0;   /* flex子元素必须设置，否则高度撑满后无法滚动 */
  background: #f0f2f7;
}

.pad    { padding: 32rpx 32rpx 0; }
.mx-pad { margin: 24rpx 32rpx 0; }

/* ===== 高峰消息滚动栏 ===== */
.peak-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #fff8e1, #fffde7);
  border-left: 6rpx solid #f6c90e;
  margin: 24rpx 32rpx 0;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  gap: 12rpx;
  overflow: hidden;

  &:active { opacity: 0.8; }

  .peak-icon { font-size: 28rpx; flex-shrink: 0; }
  .peak-arrow { font-size: 28rpx; color: #e6a817; flex-shrink: 0; }
}

.marquee-wrap {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;

  .marquee-text {
    display: inline-block;
    font-size: 24rpx;
    color: #7a5c00;
    animation: marquee-scroll 16s linear infinite;
    padding-left: 100%;
  }
}

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}


/* ===== Mini cards ===== */
.mini-card {
  flex: 1;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

  .mini-title {
    font-size: 24rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
  }

  /* CSS 性别环形图 */
  .gender-ring-wrap {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    margin: 16rpx auto 12rpx;
  }

  .gender-ring {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
  }

  /* 中心白圆制造"环形"效果 */
  .gender-hole {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 70rpx;
    height: 70rpx;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    .gender-hole-label {
      font-size: 18rpx;
      color: #666;
      font-weight: 600;
    }
  }

  /* 环形图图例 */
  .donut-legend {
    display: flex;
    justify-content: center;
    gap: 24rpx;
    margin-top: 8rpx;

    .dl-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
    }

    .dl-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dl-label {
      font-size: 20rpx;
      color: #666;
    }
  }

  /* 年龄柱 */
  .age-bars {
    display: flex;
    gap: 12rpx;
    align-items: flex-end;
    height: 150rpx;

    .age-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;

      .age-pct  { font-size: 20rpx; font-weight: 600; }
      .age-fill { width: 100%; border-radius: 6rpx 6rpx 0 0; }
      .age-label { font-size: 18rpx; color: #bbb; }
    }
  }
}

/* ===== Card ===== */
.card {
  background: #fff;
  border-radius: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 28rpx 12rpx;

    .card-title { font-size: 26rpx; font-weight: 600; color: #333; }
    .card-more  { font-size: 24rpx; color: #1f4788; }
  }
}

/* ===== 统一 tooltip 样式（与客流趋势柱体点击气泡一致） ===== */

/* 性别环形区域：relative 容器，tooltip 浮在顶部 */
.gender-ring-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* tooltip 浮层（gender + age 共用） */
.tip-float {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8rpx;

  .tip-box {
    background: rgba(26, 26, 46, 0.88);
    border-radius: 10rpx;
    padding: 10rpx 20rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    white-space: nowrap;
  }

  .tip-text {
    font-size: 22rpx;
    color: #fff;
    font-weight: 600;
  }

  .tip-divider {
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
  }

  /* 向下小三角，箭头指向下方目标 */
  .tip-arrow {
    width: 0;
    height: 0;
    border-left: 10rpx solid transparent;
    border-right: 10rpx solid transparent;
    border-top: 12rpx solid rgba(26, 26, 46, 0.88);
  }
}

/* 年龄柱的 tip-float 绝对定位在柱体正上方 */
.age-col {
  position: relative;
}

.age-tip-float {
  position: absolute;
  bottom: calc(100% - 36rpx); /* 紧贴 age-pct 上方 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

/* ===== Quick grid ===== */
.quick-card { padding: 16rpx; }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  .quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx 8rpx;

    &:active { opacity: 0.7; }

    .qi-icon {
      width: 84rpx;
      height: 84rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
    }

    .qi-label { font-size: 22rpx; color: #333; }
  }
}

/* ===== 数据来源 ===== */
.data-source {
  text-align: center;
  font-size: 20rpx;
  color: #c0c0c0;
  padding: 24rpx 0 8rpx;
}

/* ===== Store sheet ===== */
.store-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  box-sizing: border-box;
  width: 100%;

  &:last-child { border-bottom: none; }
  &:active { opacity: 0.75; }
}

.current-badge {
  flex-shrink: 0;
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  background: #e8f5e9;
  color: #17794a;
  font-size: 22rpx;
  font-weight: 600;
}

/* ===== 空提示 ===== */
.empty-tip {
  text-align: center;
  color: #bbb;
  font-size: 26rpx;
  padding: 40rpx 0;
}

.tab-spacer { height: 160rpx; }
</style>
