<template>
  <view class="page">
    <!-- ===== Header ===== -->
    <view class="hero-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="store-name">
          <text>{{ storeName }}</text>
        </view>
      </view>

      <!-- 核心数字 -->
      <view class="hero-number">
        <view class="hero-label">今日进店客流</view>
        <view class="hero-val">{{ stat.todayCount }}<text class="hero-unit">人</text></view>
        <view class="hero-delta" :class="stat.deltaPercent >= 0 ? 'delta-up' : 'delta-down'">
          <text>较昨日 {{ stat.deltaPercent >= 0 ? '+' : '' }}{{ stat.deltaPercent }}%</text>
        </view>
      </view>

      <!-- 3 格小指标 -->
      <view class="sub-metrics">
        <view class="sub-metric">
          <view class="sm-val">{{ stat.currentInStore }}<text class="sm-unit">人</text></view>
          <view class="sm-label">当前在店</view>
        </view>
        <view class="sub-metric border-x">
          <view class="sm-val">{{ stat.entryRate }}<text class="sm-unit">%</text></view>
          <view class="sm-label">进店率</view>
        </view>
        <view class="sub-metric">
          <view class="sm-val"><text v-for="(ch, i) in avgStayChars" :key="i" :class="{ 'sm-unit': ch.unit }">{{ ch.c }}</text></view>
          <view class="sm-label">平均停留</view>
        </view>
      </view>
    </view>

    <!-- ===== 滚动内容 ===== -->
    <scroll-view
      class="scroll-area"
      :scroll-y="!anySheetOpen"
      enable-flex
      :refresher-enabled="!anySheetOpen"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onPullRefresh"
      @refresherrestore="isRefreshing = false"
    >

      <!-- 高峰提醒滚动消息栏 -->
      <view v-if="peakMessage && !anySheetOpen" class="peak-banner" @click="onPeakBannerClick">
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
          <view class="mini-title-row">
            <text class="mini-title">性别分布</text>
            <text class="mini-detail" @click="goTrend">详情 ›</text>
          </view>

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
          <view class="mini-title-row">
            <text class="mini-title">年龄段</text>
            <text class="mini-detail" @click="goTrend">详情 ›</text>
          </view>
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

        <!-- 今日客群画像 -->
        <view class="mini-card" style="margin-top: 20rpx;">
          <view class="mini-title-row">
            <text class="mini-title">今日客群画像</text>
            <text class="mini-detail" @click="goTrend">详情 ›</text>
          </view>

          <view v-if="profileLoading" class="profile-loading">
            <text>加载画像中…</text>
          </view>

          <view v-else-if="profileData && profileData.totalEnter > 0" class="profile-snapshot">
            <!-- 顶部统计 -->
            <view class="ps-stat-row">
              <view class="ps-stat">
                <view class="ps-val">{{ profileData.totalEnter }}</view>
                <view class="ps-label">进店人次</view>
              </view>
              <view class="ps-stat">
                <view class="ps-val">{{ profileAvgStayText }}</view>
                <view class="ps-label">平均停留</view>
              </view>
              <view class="ps-stat">
                <view class="ps-val">{{ profileNewRatio }}%</view>
                <view class="ps-label">新客占比</view>
              </view>
            </view>

            <!-- 新客 / 回头客 -->
            <template v-if="profileNewRatio > 0 || profileReturnRatio > 0">
              <view class="ps-section-label">客户构成</view>
              <view class="gender-bar-wrap">
                <view class="gb-new"    :style="{ width: profileNewRatio    + '%' }" />
                <view class="gb-return" :style="{ width: profileReturnRatio + '%' }" />
              </view>
              <view class="gender-legend">
                <text class="gl-new">新客 {{ profileNewRatio }}%</text>
                <text class="gl-return">回头客 {{ profileReturnRatio }}%</text>
              </view>
            </template>

            <!-- 性别 -->
            <view class="ps-section-label">性别构成</view>
            <view class="gender-bar-wrap">
              <view class="gb-male"   :style="{ width: profileMaleP   + '%' }" />
              <view class="gb-female" :style="{ width: profileFemaleP + '%' }" />
            </view>
            <view class="gender-legend">
              <text class="gl-male">男 {{ profileMaleP }}%</text>
              <text class="gl-female">女 {{ profileFemaleP }}%</text>
            </view>

            <!-- 年龄段 -->
            <view class="ps-section-label">年龄分布</view>
            <view class="age-cols">
              <view class="age-col-ps" v-for="ag in profileAgeData" :key="ag.label">
                <text class="ac-pct" :style="{ color: ag.color }">{{ ag.pct }}%</text>
                <view class="ac-bar" :style="{ height: ag.h + 'rpx', background: ag.color }" />
                <text class="ac-label">{{ ag.label }}</text>
              </view>
            </view>

            <!-- 上衣类型 -->
            <template v-if="profileUpperData.some(a => a.pct > 0)">
              <view class="ps-section-label">上衣类型</view>
              <view class="attr-rows">
                <view v-for="attr in profileUpperData" :key="attr.label" class="attr-row">
                  <text class="ar-label">{{ attr.label }}</text>
                  <view class="ar-bar-bg">
                    <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                  </view>
                  <text class="ar-pct">{{ attr.pct }}%</text>
                </view>
              </view>
            </template>

            <!-- 上衣风格 -->
            <template v-if="profileUpperStyleData.some(a => a.pct > 0)">
              <view class="ps-section-label">上衣风格</view>
              <view class="attr-rows">
                <view v-for="attr in profileUpperStyleData" :key="attr.label" class="attr-row">
                  <text class="ar-label">{{ attr.label }}</text>
                  <view class="ar-bar-bg">
                    <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                  </view>
                  <text class="ar-pct">{{ attr.pct }}%</text>
                </view>
              </view>
            </template>

            <!-- 下装类型 -->
            <template v-if="profileLowerData.some(a => a.pct > 0)">
              <view class="ps-section-label">下装类型</view>
              <view class="attr-rows">
                <view v-for="attr in profileLowerData" :key="attr.label" class="attr-row">
                  <text class="ar-label">{{ attr.label }}</text>
                  <view class="ar-bar-bg">
                    <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                  </view>
                  <text class="ar-pct">{{ attr.pct }}%</text>
                </view>
              </view>
            </template>

            <!-- 下装风格 -->
            <template v-if="profileLowerStyleData.some(a => a.pct > 0)">
              <view class="ps-section-label">下装风格</view>
              <view class="attr-rows">
                <view v-for="attr in profileLowerStyleData" :key="attr.label" class="attr-row">
                  <text class="ar-label">{{ attr.label }}</text>
                  <view class="ar-bar-bg">
                    <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                  </view>
                  <text class="ar-pct">{{ attr.pct }}%</text>
                </view>
              </view>
            </template>

            <!-- 配饰 & 随身物品 -->
            <template v-if="profileAccessoryData.length">
              <view class="ps-section-label">配饰 & 随身物品</view>
              <view class="attr-rows">
                <view v-for="attr in profileAccessoryData" :key="attr.label" class="attr-row">
                  <text class="ar-label">{{ attr.label }}</text>
                  <view class="ar-bar-bg">
                    <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                  </view>
                  <text class="ar-pct">{{ attr.pct }}%</text>
                </view>
              </view>
            </template>
          </view>

          <view v-else class="profile-empty">
            <text>暂无今日画像数据</text>
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
          <view style="font-size:42rpx; font-weight:600; color:#1a1a2e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ s.name }}</view>
          <view style="font-size:33rpx; color:#999; margin-top:4rpx;">{{ s.cameraInfo }}</view>
        </view>
        <view v-if="s.id === currentStoreId" class="current-badge">当前</view>
      </view>
    </BottomSheet>

    <!-- 分钟曲线弹层 -->
    <BottomSheet :show="showMinuteSheet" :title="minuteSheetTitle" height="54vh" @close="closeMinuteSheet">
      <view class="minute-sheet-content">
        <view v-if="minuteChartReady && minuteData.length > 0" class="minute-axis-label">
          <text class="y-axis-cap">↑ 进店人数（人）</text>
          <text class="x-axis-cap">时刻（时:分）→</text>
        </view>
        <UniChart
          v-if="minuteChartReady && minuteData.length > 0"
          canvas-id="chart-minute"
          type="line"
          :data="minuteData"
          :labels="minuteLabels"
          :height="300"
          :show-y-axis="true"
          :y-unit="'人'"
        />
        <view v-if="minuteChartReady && minuteData.length === 0" class="empty-tip">该时段暂无分钟级数据</view>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import UniChart from '../../components/UniChart.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get } from '../../utils/request.js'
import { BASE_URL } from '../../utils/request.js'
import { getToken } from '../../utils/auth.js'
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

// 平均停留拆成「数字 + 单位」字符，使单位（分/秒/钟）字号与"当前在店"的"人"一致
const avgStayChars = computed(() =>
  String(stat.value.avgStay).split('').map(c => ({ c, unit: !/\d/.test(c) }))
)

const hourlyData   = ref([])
const hourlyLabels = ref([])
const hourlyPeak   = ref(10)

const ageData = ref([
  { label: '<18',   pct: 0, color: '#e8842a', barH: 0 },
  { label: '18-60', pct: 0, color: '#2d6fd6', barH: 0 },
  { label: '>60',   pct: 0, color: '#9556cc', barH: 0 }
])

// ── 今日客群画像 ─────────────────────────────────────────────
const profileData    = ref(null)
const profileLoading = ref(false)

const storeName     = ref('加载中...')
const currentStoreId = ref('')
const stores        = ref([])

const showStoreSheet  = ref(false)
const showMinuteSheet = ref(false)
const minuteChartReady = ref(false)
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
  if (!seconds) return '0分钟'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
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

async function onPullRefresh() {
  isRefreshing.value = true
  await fetchAll()
  isRefreshing.value = false
}

async function fetchProfile() {
  profileLoading.value = true
  try {
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    profileData.value = await get('/api/merchant/profile', { start: today, end: today }, { showLoad: false })
  } catch (_) {
    profileData.value = null
  } finally {
    profileLoading.value = false
  }
}

async function fetchAll() {
  await Promise.all([fetchDashboard(), fetchHourlyTrend(), fetchProfile()])
}

// ── 画像数据计算 ─────────────────────────────────────────────
function profilePct(n, total) {
  if (!total || !n) return 0
  return Math.min(100, Math.round((n / total) * 100))
}

const profileMaleP = computed(() => {
  const d = profileData.value
  if (!d) return 50
  const t = (d.genderMale || 0) + (d.genderFemale || 0)
  return t > 0 ? Math.round((d.genderMale / t) * 100) : 50
})
const profileFemaleP = computed(() => 100 - profileMaleP.value)

const profileNewRatio = computed(() => {
  const d = profileData.value
  if (!d || !d.totalEnter) return 0
  return profilePct(d.newCustomerCount, d.totalEnter)
})

const profileReturnRatio = computed(() => {
  const d = profileData.value
  if (!d || !d.totalEnter) return 0
  return profilePct(d.returningCustomerCount, d.totalEnter)
})

const profileAgeData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const t = (d.ageUnder18 || 0) + (d.age1860 || 0) + (d.ageOver60 || 0)
  if (t === 0) return [
    { label: '<18',   pct: 0, color: '#e8842a', h: 0 },
    { label: '18-60', pct: 0, color: '#2d6fd6', h: 0 },
    { label: '>60',   pct: 0, color: '#9556cc', h: 0 }
  ]
  const p1 = profilePct(d.ageUnder18, t)
  const p2 = profilePct(d.age1860, t)
  const p3 = 100 - p1 - p2
  const mx = Math.max(p1, p2, p3, 1)
  return [
    { label: '<18',   pct: p1, color: '#e8842a', h: Math.round(p1/mx*64) },
    { label: '18-60', pct: p2, color: '#2d6fd6', h: Math.round(p2/mx*64) },
    { label: '>60',   pct: p3, color: '#9556cc', h: Math.round(p3/mx*64) }
  ]
})

const profileAvgStayText = computed(() => {
  const secs = profileData.value?.avgStaySeconds || 0
  if (secs <= 0) return '--'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
})

const profileUpperData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '短袖',   pct: profilePct(d.upperShort, total), color: '#2d6fd6' },
    { label: '长袖',   pct: profilePct(d.upperLong,  total), color: '#17794a' },
    { label: '长外套', pct: profilePct(d.upperCoat,  total), color: '#e8842a' }
  ].filter(a => a.pct > 0)
})

const profileUpperStyleData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '条纹',   pct: profilePct(d.upperStyleStripe, total), color: '#5c6bc0' },
    { label: 'Logo款', pct: profilePct(d.upperStyleLogo,   total), color: '#0288d1' },
    { label: '格子',   pct: profilePct(d.upperStylePlaid,  total), color: '#00796b' },
    { label: '拼接',   pct: profilePct(d.upperStyleSplice, total), color: '#7b1fa2' }
  ].filter(a => a.pct > 0)
})

const profileLowerData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '长裤', pct: profilePct(d.lowerTrousers, total), color: '#37474f' },
    { label: '短裤', pct: profilePct(d.lowerShorts,   total), color: '#00838f' },
    { label: '裙子', pct: profilePct(d.lowerSkirt,    total), color: '#d64a7a' }
  ].filter(a => a.pct > 0)
})

const profileLowerStyleData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '条纹', pct: profilePct(d.lowerStyleStripe,  total), color: '#e65100' },
    { label: '图案', pct: profilePct(d.lowerStylePattern, total), color: '#6d4c41' }
  ].filter(a => a.pct > 0)
})

const profileAccessoryData = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '背包',     pct: profilePct(d.bagBackpack,      total), color: '#6b3399' },
    { label: '眼镜',     pct: profilePct(d.accessoryGlasses, total), color: '#1a4a8a' },
    { label: '手提包',   pct: profilePct(d.bagHandbag,       total), color: '#c62828' },
    { label: '帽子',     pct: profilePct(d.accessoryHat,     total), color: '#e8842a' },
    { label: '单肩包',   pct: profilePct(d.bagShoulder,      total), color: '#00838f' },
    { label: '靴子',     pct: profilePct(d.accessoryBoots,   total), color: '#37474f' },
    { label: '手持物品', pct: profilePct(d.holdItem,         total), color: '#795548' }
  ].filter(a => a.pct > 0)
})

// ── 分钟曲线 ─────────────────────────────────────────────────
function closeMinuteSheet() {
  showMinuteSheet.value = false
  minuteChartReady.value = false
}

async function onPeakBannerClick() {
  const info = peakHourInfo.value
  if (!info) return
  const h = Number(info.label)
  if (isNaN(h)) return

  const today = new Date()
  const pad = n => String(n).padStart(2, '0')
  const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

  minuteSheetTitle.value = `${info.label}:00 - ${info.label}:59 分钟客流`
  minuteChartReady.value = false
  minuteData.value   = []
  minuteLabels.value = []
  showMinuteSheet.value = true

  // 等待 BottomSheet 动画完成后再挂载 canvas，避免真机上 canvas 初始定位跟随背景滚动错位。
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
  } finally {
    if (showMinuteSheet.value) {
      await nextTick()
      minuteChartReady.value = true
    }
  }
}

// ── 自动刷新 ─────────────────────────────────────────────────
const isRefreshing = ref(false)
let refreshTimer = null

onMounted(() => {
  fetchAll()
  refreshTimer = setInterval(fetchAll, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// ── 导出报表 ─────────────────────────────────────────────────
function exportReport() {
  uni.showLoading({ title: '生成报表中...', mask: true })
  uni.downloadFile({
    url: `${BASE_URL}/api/merchant/export/report`,
    header: { Authorization: `Bearer ${getToken()}` },
    success(res) {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
          success() { uni.showToast({ title: '报表已生成', icon: 'success' }) },
          fail()    { uni.showToast({ title: '请在文件管理中查看', icon: 'none' }) }
        })
      } else {
        uni.showToast({ title: '导出失败', icon: 'none' })
      }
    },
    fail() { uni.showToast({ title: '网络错误', icon: 'none' }) },
    complete() { uni.hideLoading() }
  })
}

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
    padding-right: 0;
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

    .nav-export {
      font-size: 22rpx;
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.15);
      padding: 8rpx 20rpx;
      border-radius: 24rpx;
      flex-shrink: 0;
      &:active { opacity: 0.6; }
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
      font-size: 23rpx;
      opacity: 0.6;
      letter-spacing: 2rpx;
    }

    .hero-val {
      font-size: 168rpx;
      font-weight: 700;
      letter-spacing: -4rpx;
      line-height: 1.1;
      margin: 12rpx 0 8rpx;

      .hero-unit {
        font-size: 48rpx;
        font-weight: 500;
        letter-spacing: 0;
        margin-left: 8rpx;
        vertical-align: middle;
      }
    }

    .hero-delta {
      display: inline-flex;
      align-items: center;
      gap: 8rpx;
      padding: 6rpx 24rpx;
      border-radius: 40rpx;
      font-size: 23rpx;

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
        font-size: 40rpx;
        font-weight: 700;
        .sm-unit { font-size: 24rpx; font-weight: 500; }
      }

      .sm-label {
        font-size: 26rpx;
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

  .peak-icon { font-size: 34rpx; flex-shrink: 0; }
  .peak-arrow { font-size: 34rpx; color: #e6a817; flex-shrink: 0; }
}

.marquee-wrap {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;

  .marquee-text {
    display: inline-block;
    font-size: 29rpx;
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

  .mini-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16rpx;
  }

  .mini-title {
    font-size: 29rpx;
    font-weight: 600;
    color: #333;
  }

  .mini-detail {
    font-size: 26rpx;
    color: #1f4788;
    &:active { opacity: 0.6; }
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
      font-size: 22rpx;
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
      font-size: 24rpx;
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

      .age-pct  { font-size: 24rpx; font-weight: 600; }
      .age-fill { width: 100%; border-radius: 6rpx 6rpx 0 0; }
      .age-label { font-size: 22rpx; color: #bbb; }
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

    .card-title { font-size: 39rpx; font-weight: 600; color: #333; }
    .card-more  { font-size: 36rpx; color: #1f4788; }
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
    font-size: 26rpx;
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

    .qi-label { font-size: 33rpx; color: #333; }
  }
}

/* ===== 数据来源 ===== */
.data-source {
  text-align: center;
  font-size: 24rpx;
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

/* ===== 分钟曲线轴标签 ===== */
.minute-sheet-content {
  padding: 0 0 8rpx;
}

.minute-axis-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx 8rpx;

  .y-axis-cap,
  .x-axis-cap {
    font-size: 20rpx;
    color: #bbb;
  }
}

/* ===== 空提示 ===== */
.empty-tip {
  text-align: center;
  color: #bbb;
  font-size: 39rpx;
  padding: 40rpx 0;
}

/* ===== 今日客群画像 ===== */
.profile-loading,
.profile-empty {
  text-align: center;
  padding: 40rpx 0;
  font-size: 21rpx;
  color: #ccc;
}

.profile-snapshot {
  .ps-stat-row {
    display: flex;
    margin-bottom: 32rpx;

    .ps-stat {
      flex: 1;
      text-align: center;

      &:not(:last-child) { border-right: 1rpx solid #f0f0f0; }

      .ps-val   { font-size: 32rpx; font-weight: 700; color: #1a1a2e; }
      .ps-label { font-size: 18rpx; color: #999; margin-top: 4rpx; }
    }
  }

  .ps-section-label {
    font-size: 21rpx;
    color: #888;
    margin-bottom: 16rpx;
    margin-top: 24rpx;
    font-weight: 500;

    &:first-child { margin-top: 0; }
  }

  .gender-bar-wrap {
    height: 20rpx;
    border-radius: 10rpx;
    overflow: hidden;
    display: flex;
    margin-bottom: 10rpx;

    .gb-male   { background: linear-gradient(90deg, #1a4a8a, #3a7ad6); transition: width .3s; }
    .gb-female { background: linear-gradient(90deg, #d64a7a, #e8729a); transition: width .3s; }
    .gb-new    { background: linear-gradient(90deg, #17794a, #34a871); transition: width .3s; }
    .gb-return { background: linear-gradient(90deg, #e8842a, #f5a742); transition: width .3s; }
  }

  .gender-legend {
    display: flex;
    justify-content: space-between;
    font-size: 19rpx;

    .gl-male   { color: #2d6fd6; }
    .gl-female { color: #d64a7a; }
    .gl-new    { color: #17794a; }
    .gl-return { color: #e8842a; }
  }

  .age-cols {
    display: flex;
    gap: 16rpx;
    align-items: flex-end;

    .age-col-ps {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;

      .ac-pct   { font-size: 19rpx; font-weight: 600; }
      .ac-bar   { width: 100%; border-radius: 6rpx 6rpx 0 0; }
      .ac-label { font-size: 16rpx; color: #bbb; }
    }
  }

  .attr-rows {
    .attr-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 18rpx;

      &:last-child { margin-bottom: 0; }

      .ar-label {
        width: 130rpx;
        font-size: 19rpx;
        color: #666;
        flex-shrink: 0;
      }

      .ar-bar-bg {
        flex: 1;
        height: 14rpx;
        background: #f0f0f0;
        border-radius: 7rpx;
        overflow: hidden;

        .ar-bar-fill { height: 100%; border-radius: 7rpx; transition: width .4s ease; }
      }

      .ar-pct {
        width: 70rpx;
        font-size: 19rpx;
        color: #999;
        text-align: right;
        flex-shrink: 0;
      }
    }
  }
}

.tab-spacer { height: 160rpx; }
</style>
