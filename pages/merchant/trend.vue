<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar" :style="navBarStyle">
        <view class="header-title">客流趋势</view>
        <view class="nav-export-btn" @click="onExportClick">导出</view>
      </view>
    </view>

    <scroll-view class="scroll-area" scroll-y enable-flex>

      <!-- ① 粒度 Tab -->
      <view class="tab-switch">
        <button
          v-for="(t, i) in tabs"
          :key="i"
          :class="{ active: activeTab === i }"
          @click="switchTab(i)"
        >{{ t.label }}</button>
      </view>

      <!-- ④ 日期选择行 -->
      <view class="date-row">
        <!-- 小时Tab：选择哪天 -->
        <template v-if="activeTab === 0">
          <picker mode="date" :value="selectedDate" :end="todayStr" @change="onHourDateChange">
            <view class="date-btn">📅 {{ selectedDate }}</view>
          </picker>
        </template>
        <!-- 日Tab：自定义日期范围（最多15天） -->
        <template v-else-if="activeTab === 1">
          <picker mode="date" :value="dateStart" :end="todayStr" @change="onDayStartChange">
            <view class="date-btn">{{ dateStart }}</view>
          </picker>
          <text class="date-sep">—</text>
          <picker mode="date" :value="dateEnd" :start="dateStart" :end="todayStr" @change="onDayEndChange">
            <view class="date-btn">{{ dateEnd }}</view>
          </picker>
          <text class="date-range-tag" :class="{ 'tag-warn': dayCount >= maxDays }">{{ dayCount }}天</text>
          <text class="date-limit-tip">最多{{ maxDays }}天</text>
        </template>
        <!-- 月Tab：选择月份范围（最多12个月） -->
        <template v-else>
          <picker mode="date" fields="month" :value="monthStart" :end="monthEnd" @change="onMonthStartChange">
            <view class="date-btn">{{ monthStart }}</view>
          </picker>
          <text class="date-sep">—</text>
          <picker mode="date" fields="month" :value="monthEnd" :start="monthStart" :end="todayMonth" @change="onMonthEndChange">
            <view class="date-btn">{{ monthEnd }}</view>
          </picker>
          <text class="date-range-tag" :class="{ 'tag-warn': monthCount >= 12 }">{{ monthCount }}个月</text>
          <text class="date-limit-tip">最多12个月</text>
        </template>
      </view>

      <!-- 摘要行 -->
      <view class="summary-row">
        <view class="summary-item">
          <view class="si-val">{{ loading ? '…' : summary.total }}<text v-if="!loading" class="si-unit">人</text></view>
          <view class="si-label">总客流</view>
        </view>
        <view class="summary-item">
          <view class="si-val">{{ loading ? '…' : summary.avg }}<text v-if="!loading" class="si-unit">人</text></view>
          <view class="si-label">{{ avgLabel }}</view>
        </view>
        <view class="summary-item">
          <view class="si-val">{{ loading ? '…' : summary.peak }}<text v-if="!loading && summary.peak !== '--' && peakUnit" class="si-unit">{{ peakUnit }}</text></view>
          <view class="si-label">{{ peakLabel }}</view>
        </view>
      </view>

      <!-- ②③⑤ 折线图卡片 -->
      <view class="chart-card">
        <!-- 卡片头：标题 + 对比同期（小时视图） -->
        <view class="chart-card-header">
          <text class="chart-card-title">客流折线图</text>
          <view v-if="activeTab === 0" class="compare-area">
            <picker
              mode="date"
              :value="compareDate"
              @change="onCompareDateChange"
            >
              <view class="compare-toggle" :class="{ active: showCompare }">
                <text>{{ showCompare ? compareDate : '对比同期' }}</text>
              </view>
            </picker>
            <text v-if="showCompare" class="compare-close" @click.stop="closeCompare">✕</text>
          </view>
        </view>

        <!-- ② 对比图例 -->
        <view v-if="showCompare && compareChartData.length" class="compare-legend">
          <view class="cl-item">
            <view class="cl-line main-line" /><text>{{ selectedDate }}</text>
          </view>
          <view class="cl-item">
            <view class="cl-line compare-line" /><text>{{ compareDate }}</text>
          </view>
        </view>

        <view v-if="loading && chartData.length === 0" class="chart-placeholder">
          <text class="placeholder-text">加载中…</text>
        </view>
        <view v-else-if="chartData.length === 0" class="chart-placeholder">
          <text class="placeholder-text">暂无数据</text>
        </view>
        <!-- ②③⑤ 折线图，带峰值标注、对比线、横向滚动；切 tab 时保持挂载 -->
        <template v-else>
          <UniChart
            canvas-id="chart-trend"
            type="line"
            :data="chartData"
            :labels="chartLabels"
            :compare-data="showCompare ? compareChartData : []"
            :show-peak="true"
            :show-y-axis="true"
            :y-unit="'人'"
            :scrollable="activeTab === 1 || (activeTab === 2 && monthCount > 6)"
            :scroll-threshold="activeTab === 2 ? 6 : 14"
            :point-w="44"
            :height="360"
            @line-touch="onLineTouch"
            @line-release="onLineRelease"
          />
          <view class="chart-axis-hint">
            <text>↑ 进店人数（人）</text>
            <text>{{ activeTab === 0 ? '时段（时）' : activeTab === 1 ? '日期' : '月份' }} →</text>
          </view>
        </template>

        <view v-if="chartData.length > 0 && selectedIdx === null" class="chart-hint">
          <text class="chart-hint-icon">👆</text> 点击图中点位可切换时段，查看对应客群画像
        </view>
        <view v-if="selectedIdx !== null" class="chart-hint chart-hint--active">
          <text class="chart-hint-icon">📍</text> 当前查看：{{ selectedLabel }} · 点击其他点位切换
        </view>
      </view>

      <!-- 时段客群画像 Card -->
      <template v-if="selectedIdx !== null">
        <view class="section-title">
          {{ selectedLabel }} 客群画像
          <text class="section-close" @click="clearSelection">✕</text>
        </view>

        <view v-if="profileLoading" class="profile-loading">
          <text>加载画像中…</text>
        </view>

        <view v-else-if="selectedProfile" class="profile-snapshot">
          <!-- 顶部统计 -->
          <view class="ps-stat-row">
            <view class="ps-stat">
              <view class="ps-val">{{ selectedProfile.totalEnter }}</view>
              <view class="ps-label">进店人次</view>
            </view>
            <view class="ps-stat">
              <view class="ps-val">{{ avgStayText }}</view>
              <view class="ps-label">平均停留</view>
            </view>
            <view class="ps-stat">
              <view class="ps-val">{{ newRatio }}%</view>
              <view class="ps-label">新客占比</view>
            </view>
          </view>

          <!-- 新客 / 回头客 -->
          <template v-if="newRatio > 0 || returnRatio > 0">
            <view class="ps-section-label">客户构成</view>
            <view class="gender-bar-wrap">
              <view class="gb-new"      :style="{ width: newRatio    + '%' }" />
              <view class="gb-return"   :style="{ width: returnRatio + '%' }" />
            </view>
            <view class="gender-legend">
              <text class="gl-new">新客 {{ newRatio }}%</text>
              <text class="gl-return">回头客 {{ returnRatio }}%</text>
            </view>
          </template>

          <!-- 性别 -->
          <view class="ps-section-label">性别构成</view>
          <view class="gender-bar-wrap">
            <view class="gb-male" :style="{ width: maleP + '%' }" />
            <view class="gb-female" :style="{ width: femaleP + '%' }" />
          </view>
          <view class="gender-legend">
            <text class="gl-male">男 {{ maleP }}%</text>
            <text class="gl-female">女 {{ femaleP }}%</text>
          </view>

          <!-- 年龄段 -->
          <view class="ps-section-label">年龄分布</view>
          <view class="age-cols">
            <view class="age-col" v-for="ag in ageData" :key="ag.label">
              <text class="ac-pct" :style="{ color: ag.color }">{{ ag.pct }}%</text>
              <view class="ac-bar" :style="{ height: ag.h + 'rpx', background: ag.color }" />
              <text class="ac-label">{{ ag.label }}</text>
            </view>
          </view>

          <!-- 上衣类型 -->
          <template v-if="upperData.some(a => a.pct > 0)">
            <view class="ps-section-label">上衣类型</view>
            <view class="attr-rows">
              <view v-for="attr in upperData" :key="attr.label" class="attr-row">
                <text class="ar-label">{{ attr.label }}</text>
                <view class="ar-bar-bg">
                  <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                </view>
                <text class="ar-pct">{{ attr.pct }}%</text>
              </view>
            </view>
          </template>

          <!-- 上衣风格 -->
          <template v-if="upperStyleData.some(a => a.pct > 0)">
            <view class="ps-section-label">上衣风格</view>
            <view class="attr-rows">
              <view v-for="attr in upperStyleData" :key="attr.label" class="attr-row">
                <text class="ar-label">{{ attr.label }}</text>
                <view class="ar-bar-bg">
                  <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                </view>
                <text class="ar-pct">{{ attr.pct }}%</text>
              </view>
            </view>
          </template>

          <!-- 下装类型 -->
          <template v-if="lowerData.some(a => a.pct > 0)">
            <view class="ps-section-label">下装类型</view>
            <view class="attr-rows">
              <view v-for="attr in lowerData" :key="attr.label" class="attr-row">
                <text class="ar-label">{{ attr.label }}</text>
                <view class="ar-bar-bg">
                  <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                </view>
                <text class="ar-pct">{{ attr.pct }}%</text>
              </view>
            </view>
          </template>

          <!-- 下装风格 -->
          <template v-if="lowerStyleData.some(a => a.pct > 0)">
            <view class="ps-section-label">下装风格</view>
            <view class="attr-rows">
              <view v-for="attr in lowerStyleData" :key="attr.label" class="attr-row">
                <text class="ar-label">{{ attr.label }}</text>
                <view class="ar-bar-bg">
                  <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                </view>
                <text class="ar-pct">{{ attr.pct }}%</text>
              </view>
            </view>
          </template>

          <!-- 配饰 & 随身物品 -->
          <template v-if="accessoryData.length">
            <view class="ps-section-label">配饰 & 随身物品</view>
            <view class="attr-rows">
              <view v-for="attr in accessoryData" :key="attr.label" class="attr-row">
                <text class="ar-label">{{ attr.label }}</text>
                <view class="ar-bar-bg">
                  <view class="ar-bar-fill" :style="{ width: attr.pct + '%', background: attr.color }" />
                </view>
                <text class="ar-pct">{{ attr.pct }}%</text>
              </view>
            </view>
          </template>

          <!-- AI 客群洞察 -->
          <view class="insight-wrap">
            <template v-if="!profileInsight">
              <button class="insight-btn" :disabled="insightLoading" @click="generateInsight">
                {{ insightLoading ? '分析中…' : 'AI 客群分析' }}
              </button>
            </template>
            <template v-else>
              <view class="insight-box">
                <view class="insight-box-hd">
                  <text class="insight-box-title">✨ AI 客群洞察</text>
                  <text class="insight-box-close" @click="profileInsight = null">✕</text>
                </view>
                <text class="insight-box-content">{{ profileInsight }}</text>
              </view>
            </template>
          </view>
        </view>

        <!-- 停留时长分析 Card（独立卡片，与画像并列；月 Tab 不显示） -->
        <template v-if="activeTab !== 3">
        <view class="section-title stay-section-title">{{ selectedLabel }} 停留时长分析</view>
        <view class="stay-analysis-card">

          <!-- 顶部：均值 + 较前期 + 有效人次 -->
          <view class="stay-summary-row">
            <view class="stay-summary-cell">
              <view class="ssc-val">{{ stayAvgText }}</view>
              <view class="ssc-label">平均停留</view>
            </view>
            <view class="stay-summary-cell">
              <view class="ssc-delta" :class="stayDeltaClass">{{ stayDeltaText }}</view>
              <view class="ssc-label">较前期</view>
            </view>
            <view class="stay-summary-cell">
              <view class="ssc-val">{{ stayData ? stayData.stayCount : '--' }}</view>
              <view class="ssc-label">有效人次</view>
            </view>
          </view>

          <!-- 停留分布直方图 -->
          <view class="stay-dist-title">停留分布</view>
          <view class="stay-dist-bars" v-if="stayData && stayData.stayCount > 0">
            <view
              v-for="(b, i) in stayBuckets"
              :key="b.label"
              class="sdb-col"
              @click="stayActiveBar = stayActiveBar === i ? -1 : i"
            >
              <view v-if="stayActiveBar === i" class="sdb-tip">
                <text>{{ b.count }}人</text>
              </view>
              <text class="sdb-pct" :style="{ color: b.color, opacity: stayActiveBar === i ? 0 : 1 }">{{ b.pct }}%</text>
              <view class="sdb-bar-wrap">
                <view class="sdb-bar" :style="{ height: b.barH + 'rpx', background: b.color }" />
              </view>
              <text class="sdb-label">{{ b.label }}</text>
            </view>
          </view>
          <view v-else-if="stayLoading" class="stay-empty">加载中…</view>
          <view v-else class="stay-empty">暂无停留分布数据</view>

        </view>
        </template>
      </template>

      <view class="tab-spacer" />
    </scroll-view>

    <!-- 导出 BottomSheet -->
    <view v-if="showExportSheet" class="sheet-mask" @click="showExportSheet = false">
      <view class="export-sheet" @click.stop>
        <view class="es-title">导出数据</view>

        <view class="es-label">导出内容</view>
        <view class="es-opts">
          <view class="es-opt" :class="{ selected: exportScope === 'trend' }" @click="exportScope = 'trend'">客流折线图</view>
          <template v-if="selectedIdx !== null">
            <view class="es-opt" :class="{ selected: exportScope === 'profile' }" @click="exportScope = 'profile'">客群画像</view>
            <view class="es-opt" :class="{ selected: exportScope === 'both' }" @click="exportScope = 'both'">全部</view>
          </template>
        </view>

        <view class="es-label">文件格式</view>
        <view class="es-opts">
          <view class="es-opt" :class="{ selected: exportFormat === 'excel' }" @click="exportFormat = 'excel'">Excel</view>
          <view class="es-opt" :class="{ selected: exportFormat === 'pdf' }" @click="exportFormat = 'pdf'">PDF</view>
        </view>

        <button class="es-btn" :disabled="exporting" @click="doExport">
          {{ exporting ? '正在导出…' : '确认导出' }}
        </button>
      </view>
    </view>

    <TabBar role="merchant" :current="1" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import UniChart from '../../components/UniChart.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, post, BASE_URL } from '../../utils/request.js'
import { getToken } from '../../utils/auth.js'

// ── 日期工具 ─────────────────────────────────────────────────
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function nDaysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return toISO(d)
}
function toYearMonth(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
function nMonthsAgo(n) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - n); return toYearMonth(d)
}
function lastDayOfMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2,'0')}`
}
const todayStr   = toISO(new Date())
const todayMonth = toYearMonth(new Date())

// ── Tab 定义 ──────────────────────────────────────────────────
const tabs = [
  { label: '当日', type: 'hour'  },
  { label: '近七天', type: 'day'   },
  { label: '近六月', type: 'month' }
]

// ── 状态 ──────────────────────────────────────────────────────
const packageType = ref(1)
const maxDays     = computed(() => ({ 1: 15, 2: 31, 3: 90 }[packageType.value] || 15))

const activeTab        = ref(0)
const loading          = ref(false)
const trendPoints      = ref([])

// ④ 日期选择
const selectedDate = ref(todayStr)       // 小时Tab：看哪天
const dateStart    = ref(nDaysAgo(6))    // 日Tab：开始
const dateEnd      = ref(todayStr)       // 日Tab：结束
const monthStart   = ref(nMonthsAgo(5)) // 月Tab：开始月（默认近6个月）
const monthEnd     = ref(todayMonth)     // 月Tab：结束月

// ② 对比线
const showCompare    = ref(false)
const comparePoints  = ref([])
const compareLoading = ref(false)
const compareDate = ref(nDaysAgo(1))   // 选中的对比日期，默认昨日

// 画像状态
const selectedIdx     = ref(null)
const profileLoading  = ref(false)
const selectedProfile = ref(null)
const insightLoading  = ref(false)
const profileInsight  = ref(null)

// 导出
const navBarStyle     = ref({})
const showExportSheet = ref(false)
const exportFormat    = ref('excel')
const exportScope     = ref('trend')
const exporting       = ref(false)

// 停留时长分析状态
const stayLoading   = ref(false)
const stayData      = ref(null)
const stayActiveBar = ref(-1)

// ── 日期范围计算 ──────────────────────────────────────────────
const dayCount = computed(() => {
  if (!dateStart.value || !dateEnd.value) return 0
  const ms = new Date(dateEnd.value) - new Date(dateStart.value)
  return Math.round(ms / 86400000) + 1
})

const monthCount = computed(() => {
  if (!monthStart.value || !monthEnd.value) return 0
  const [sy, sm] = monthStart.value.split('-').map(Number)
  const [ey, em] = monthEnd.value.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm) + 1
})


// ── 数据加载 ─────────────────────────────────────────────────
async function loadTrend() {
  loading.value = true
  // 注意：这里不清空 trendPoints，让旧数据保持显示直到新数据到达，
  // 使 <UniChart> 在切 tab 时保持挂载（不重建原生 canvas），避免原生缓冲区
  // 重建导致横坐标/最右点被裁、触摸区错位。
  comparePoints.value = []
  clearSelection()

  const type = tabs[activeTab.value].type
  const params = { type }

  if (type === 'hour') {
    params.start = selectedDate.value
    params.end   = selectedDate.value
  } else if (type === 'day') {
    params.start = dateStart.value
    params.end   = dateEnd.value
  } else if (type === 'month') {
    params.start = monthStart.value + '-01'
    params.end   = lastDayOfMonth(monthEnd.value)
  }

  try {
    const data = await get('/api/merchant/trend', params)
    trendPoints.value = Array.isArray(data) ? data : []
  } catch (_) {
  } finally {
    loading.value = false
  }

  if (showCompare.value) fetchCompare()
}

function switchTab(i) {
  if (activeTab.value === i) return
  activeTab.value = i
  showCompare.value = false
  comparePoints.value = []
  if (i === 1) {
    dateStart.value = nDaysAgo(6)
    dateEnd.value   = todayStr
  } else if (i === 2) {
    monthStart.value = nMonthsAgo(5)
    monthEnd.value   = todayMonth
  }
  loadTrend()
}

onMounted(async () => {
  try {
    const rect = uni.getMenuButtonBoundingClientRect()
    const sys  = uni.getSystemInfoSync()
    // reserve the space the WeChat capsule occupies on the right
    const rightPx = sys.screenWidth - rect.left + 8
    navBarStyle.value = { paddingRight: rightPx + 'px' }
  } catch (_) {}
  try {
    const d = await get('/api/merchant/dashboard', {}, { showLoad: false })
    if (d?.packageType) packageType.value = d.packageType
  } catch (_) {}
  loadTrend()
})

// ④ 日期选择事件
function onHourDateChange(e) {
  selectedDate.value = e.detail.value
  loadTrend()
}

function onDayStartChange(e) {
  const newStart = e.detail.value
  const d1 = new Date(newStart)
  const d2 = new Date(dateEnd.value)
  if ((d2 - d1) / 86400000 >= maxDays.value) {
    uni.showToast({ title: `最多可选 ${maxDays.value} 天`, icon: 'none', duration: 2000 })
    return
  }
  dateStart.value = newStart
  loadTrend()
}

function onDayEndChange(e) {
  const newEnd = e.detail.value
  const d1 = new Date(dateStart.value)
  const d2 = new Date(newEnd)
  if ((d2 - d1) / 86400000 >= maxDays.value) {
    uni.showToast({ title: `最多可选 ${maxDays.value} 天`, icon: 'none', duration: 2000 })
    return
  }
  dateEnd.value = newEnd
  loadTrend()
}

function onMonthStartChange(e) {
  const newStart = e.detail.value
  const [sy, sm] = newStart.split('-').map(Number)
  const [ey, em] = monthEnd.value.split('-').map(Number)
  if ((ey - sy) * 12 + (em - sm) + 1 > 12) {
    uni.showToast({ title: '最多可选12个月', icon: 'none', duration: 2000 })
    return
  }
  monthStart.value = newStart
  loadTrend()
}

function onMonthEndChange(e) {
  const newEnd = e.detail.value
  const [sy, sm] = monthStart.value.split('-').map(Number)
  const [ey, em] = newEnd.split('-').map(Number)
  if ((ey - sy) * 12 + (em - sm) + 1 > 12) {
    uni.showToast({ title: '最多可选12个月', icon: 'none', duration: 2000 })
    return
  }
  monthEnd.value = newEnd
  loadTrend()
}

// ② 对比线逻辑
function onCompareDateChange(e) {
  const picked = e.detail.value
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const pickedDay = new Date(picked)
  const diffDays  = Math.round((today - pickedDay) / 86400000)

  if (diffDays <= 0) {
    uni.showToast({ title: '不能选择今天或未来日期', icon: 'none' }); return
  }
  if (diffDays > maxDays.value) {
    uni.showToast({ title: `当前套餐最多可对比 ${maxDays.value} 天前的数据`, icon: 'none', duration: 2500 }); return
  }

  compareDate.value   = picked
  showCompare.value   = true
  comparePoints.value = []
  fetchCompare()
}

function closeCompare() {
  showCompare.value   = false
  comparePoints.value = []
}

async function fetchCompare() {
  const type = tabs[activeTab.value].type
  let params = null

  if (type === 'hour') {
    params = { type: 'hour', start: compareDate.value, end: compareDate.value }
  } else if (type === 'day') {
    // 上一个同等长度区间
    const n = dayCount.value
    const d1 = new Date(dateStart.value); d1.setDate(d1.getDate() - n)
    const d2 = new Date(dateEnd.value);   d2.setDate(d2.getDate() - n)
    params = { type: 'day', start: toISO(d1), end: toISO(d2) }
  }

  if (!params) return
  compareLoading.value = true
  try {
    const data = await get('/api/merchant/trend', params)
    comparePoints.value = Array.isArray(data) ? data : []
  } catch (_) {
    comparePoints.value = []
  } finally {
    compareLoading.value = false
  }
}

// 将对比数据对齐到主数据的时间槽
// ── 小时视图：合并两天时间轴，短的用 null 补位 ────────────────
const unifiedHourSlots = computed(() => {
  if (!showCompare.value || tabs[activeTab.value].type !== 'hour') return null
  const mainByHour = {}
  trendPoints.value.forEach(p => {
    const h = parseInt((p.timeLabel || '').split(' ')[1]?.split(':')[0] ?? '0')
    mainByHour[h] = p.enterCount
  })
  const compByHour = {}
  comparePoints.value.forEach(p => {
    const h = parseInt((p.timeLabel || '').split(' ')[1]?.split(':')[0] ?? '0')
    compByHour[h] = p.enterCount
  })
  const allHours = [...new Set([
    ...Object.keys(mainByHour).map(Number),
    ...Object.keys(compByHour).map(Number)
  ])].sort((a, b) => a - b)
  return allHours.map(h => ({
    label: String(h).padStart(2, '0'),
    main: mainByHour[h] ?? null,
    comp: compByHour[h] ?? null
  }))
})

const compareChartData = computed(() => {
  if (unifiedHourSlots.value) return unifiedHourSlots.value.map(s => s.comp)

  const main = trendPoints.value
  const comp = comparePoints.value
  if (!main.length || !comp.length) return []

  // 日/周/月：按位置对齐，缺失用 null
  return main.map((_, i) => comp[i]?.enterCount ?? null)
})

// ── 时间标签格式化 ────────────────────────────────────────────
function formatLabel(label) {
  if (!label) return ''
  switch (tabs[activeTab.value].type) {
    case 'hour': {
      const m = label.match(/(\d{2}):\d{2}:\d{2}$/)
      return m ? m[1] : label
    }
    case 'day':
    case 'week': {
      const m = label.match(/\d{4}-(\d{2})-(\d{2})/)
      return m ? `${parseInt(m[1])}/${parseInt(m[2])}号` : label
    }
    case 'month': {
      const m = label.match(/\d{4}-(\d{2})/)
      return m ? `${m[1]}月` : label
    }
    default: return label
  }
}

// ── 图表数据 ─────────────────────────────────────────────────
const chartData   = computed(() =>
  unifiedHourSlots.value
    ? unifiedHourSlots.value.map(s => s.main)
    : trendPoints.value.map(p => p.enterCount)
)
const chartLabels = computed(() => {
  const isHour = tabs[activeTab.value].type === 'hour'
  if (unifiedHourSlots.value)
    return unifiedHourSlots.value.map(s => isHour ? s.label + ':00' : s.label)
  return trendPoints.value.map(p => {
    const lbl = formatLabel(p.timeLabel)
    return isHour ? lbl + ':00' : lbl
  })
})

const chartTitle = computed(() => {
  const map = {
    hour:  `${selectedDate.value} 小时客流`,
    day:   `${dateStart.value} 至 ${dateEnd.value}`,
    week:  '近8周客流',
    month: '近12个月客流'
  }
  return map[tabs[activeTab.value].type] || '客流趋势'
})

// ── 摘要 ─────────────────────────────────────────────────────
const summary = computed(() => {
  const pts = trendPoints.value
  if (!pts.length) return { total: 0, avg: 0, peak: '--' }
  const total = pts.reduce((s, p) => s + p.enterCount, 0)
  const avg   = Math.round(total / pts.length)
  const maxPt = pts.reduce((a, b) => b.enterCount > a.enterCount ? b : a, pts[0])
  let peak
  if (tabs[activeTab.value].type === 'hour') {
    const h = parseInt(maxPt.timeLabel?.split(' ')[1] ?? '0')
    peak = `${h}-${h + 1}点`
  } else if (tabs[activeTab.value].type === 'day') {
    const m = maxPt.timeLabel?.match(/\d{4}-(\d{2})-(\d{2})/)
    peak = m ? `${parseInt(m[1])}/${parseInt(m[2])}日` : formatLabel(maxPt.timeLabel)
  } else {
    peak = formatLabel(maxPt.timeLabel)
  }
  return { total, avg, peak }
})

const avgLabel = computed(() => {
  const map = { hour: '时均', day: '日均', week: '周均', month: '月均' }
  return map[tabs[activeTab.value].type] || '均值'
})

const peakLabel = computed(() => {
  const map = { hour: '峰值时段', day: '峰值日', week: '峰值周', month: '峰值月' }
  return map[tabs[activeTab.value].type] || '峰值'
})

const peakUnit = computed(() => '')

// ── 折线点击 → 并行加载画像 + 停留分析 ──────────────────────
function onLineTouch(idx) {
  if (selectedIdx.value === idx) return
  selectedIdx.value = idx
  // 立即清空旧数据，避免点切换时短暂显示上一个点的数据
  selectedProfile.value = null
  profileInsight.value  = null
  stayData.value = null
  stayActiveBar.value = -1
  // 并行发起两个请求，互不等待
  loadProfile(idx)
  loadStayAnalysis(idx)
}

function onLineRelease() {
  // 保留已显示的画像，不清除
}

function clearSelection() {
  selectedIdx.value     = null
  selectedProfile.value = null
  profileInsight.value  = null
  stayData.value        = null
  stayActiveBar.value   = -1
}

function buildProfileParams(idx) {
  const pt   = trendPoints.value[idx]
  if (!pt) return null
  const type  = tabs[activeTab.value].type
  const label = pt.timeLabel

  switch (type) {
    case 'hour': {
      const isoBase = label.replace(' ', 'T')
      const h = parseInt(label.split(' ')[1])
      const dateStr = label.split(' ')[0]
      const endH = String(h + 1).padStart(2, '0')
      return { startDt: isoBase, endDt: `${dateStr}T${endH}:00:00` }
    }
    case 'day':
      return { start: label, end: label }
    case 'week': {
      const d   = new Date(label)
      const sun = new Date(d.getTime() + 6 * 86400000)
      return { start: label, end: toISO(sun) }
    }
    case 'month': {
      const [y, mo] = label.split('-').map(Number)
      const last = new Date(y, mo, 0).getDate()
      return { start: `${label}-01`, end: `${label}-${String(last).padStart(2,'0')}` }
    }
  }
}

async function generateInsight() {
  const confirmed = await new Promise(resolve => {
    uni.showModal({
      title: '生成 AI 客群分析',
      content: '将根据该时段客群画像数据调用 AI 生成分析，是否继续？',
      confirmText: '生成',
      cancelText: '取消',
      success: res => resolve(res.confirm)
    })
  })
  if (!confirmed) return

  const params = buildProfileParams(selectedIdx.value)
  if (!params) return
  insightLoading.value = true
  try {
    const data = await post('/api/merchant/profile/insight', params, { showLoad: false })
    profileInsight.value = data?.content || ''
  } catch (_) {
  } finally {
    insightLoading.value = false
  }
}

async function loadProfile(idx) {
  const params = buildProfileParams(idx)
  if (!params) return
  profileLoading.value = true
  try {
    selectedProfile.value = await get('/api/merchant/profile', params, { showLoad: false })
  } catch (_) {
    selectedProfile.value = null
  } finally {
    profileLoading.value = false
  }
}

// ── 选中时段标签 ─────────────────────────────────────────────
const selectedLabel = computed(() => {
  if (selectedIdx.value === null) return ''
  const pt = trendPoints.value[selectedIdx.value]
  if (!pt) return ''
  const type  = tabs[activeTab.value].type
  const label = pt.timeLabel
  if (type === 'hour') {
    const h = parseInt(label.split(' ')[1])
    return `${h}:00 - ${h+1}:00`
  }
  return formatLabel(label)
})

// ── 画像数据计算 ─────────────────────────────────────────────
function pct(n, total) {
  if (!total || !n) return 0
  return Math.min(100, Math.round((n / total) * 100))
}

const maleP = computed(() => {
  const d = selectedProfile.value
  if (!d) return 50
  const t = (d.genderMale || 0) + (d.genderFemale || 0)
  return t > 0 ? Math.round((d.genderMale / t) * 100) : 50
})
const femaleP = computed(() => 100 - maleP.value)

const newRatio = computed(() => {
  const d = selectedProfile.value
  if (!d || !d.totalEnter) return 0
  return pct(d.newCustomerCount, d.totalEnter)
})

const returnRatio = computed(() => {
  const d = selectedProfile.value
  if (!d || !d.totalEnter) return 0
  return pct(d.returningCustomerCount, d.totalEnter)
})

const ageData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const t = (d.ageUnder18 || 0) + (d.age1860 || 0) + (d.ageOver60 || 0) || 1
  const p1 = pct(d.ageUnder18, t)
  const p2 = pct(d.age1860, t)
  const p3 = 100 - p1 - p2
  const mx = Math.max(p1, p2, p3, 1)
  return [
    { label: '<18',   pct: p1, color: '#e8842a', h: Math.round(p1/mx*64) },
    { label: '18-60', pct: p2, color: '#2d6fd6', h: Math.round(p2/mx*64) },
    { label: '>60',   pct: p3, color: '#9556cc', h: Math.round(p3/mx*64) }
  ]
})

const avgStayText = computed(() => {
  const secs = selectedProfile.value?.avgStaySeconds || 0
  if (secs <= 0) return '--'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
})

const upperData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '短袖',   pct: pct(d.upperShort, total), color: '#2d6fd6' },
    { label: '长袖',   pct: pct(d.upperLong,  total), color: '#17794a' },
    { label: '长外套', pct: pct(d.upperCoat,  total), color: '#e8842a' }
  ].filter(a => a.pct > 0)
})

const upperStyleData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '条纹',   pct: pct(d.upperStyleStripe, total), color: '#5c6bc0' },
    { label: 'Logo款', pct: pct(d.upperStyleLogo,   total), color: '#0288d1' },
    { label: '格子',   pct: pct(d.upperStylePlaid,  total), color: '#00796b' },
    { label: '拼接',   pct: pct(d.upperStyleSplice, total), color: '#7b1fa2' }
  ].filter(a => a.pct > 0)
})

const lowerData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '长裤', pct: pct(d.lowerTrousers, total), color: '#37474f' },
    { label: '短裤', pct: pct(d.lowerShorts,   total), color: '#00838f' },
    { label: '裙子', pct: pct(d.lowerSkirt,    total), color: '#d64a7a' }
  ].filter(a => a.pct > 0)
})

const lowerStyleData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '条纹', pct: pct(d.lowerStyleStripe,  total), color: '#e65100' },
    { label: '图案', pct: pct(d.lowerStylePattern,  total), color: '#6d4c41' }
  ].filter(a => a.pct > 0)
})

const accessoryData = computed(() => {
  const d = selectedProfile.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    { label: '背包',     pct: pct(d.bagBackpack,      total), color: '#6b3399' },
    { label: '眼镜',     pct: pct(d.accessoryGlasses, total), color: '#1a4a8a' },
    { label: '手提包',   pct: pct(d.bagHandbag,       total), color: '#c62828' },
    { label: '帽子',     pct: pct(d.accessoryHat,     total), color: '#e8842a' },
    { label: '单肩包',   pct: pct(d.bagShoulder,      total), color: '#00838f' },
    { label: '靴子',     pct: pct(d.accessoryBoots,   total), color: '#37474f' },
    { label: '手持物品', pct: pct(d.holdItem,         total), color: '#795548' }
  ].filter(a => a.pct > 0)
})

// ── ⑥ 停留时长分析 ───────────────────────────────────────────
function fmtSecs(secs) {
  if (!secs || secs <= 0) return '--'
  if (secs < 60) return `${secs}秒`
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
}

const stayAvgText = computed(() => fmtSecs(stayData.value?.avgStaySeconds))

const stayDeltaClass = computed(() => {
  const cur  = stayData.value?.avgStaySeconds     || 0
  const prev = stayData.value?.prevAvgStaySeconds || 0
  if (!prev) return 'delta-neutral'
  return cur >= prev ? 'delta-up' : 'delta-down'
})

const stayDeltaText = computed(() => {
  const cur  = stayData.value?.avgStaySeconds     || 0
  const prev = stayData.value?.prevAvgStaySeconds || 0
  if (!prev) return '--'
  const diff = cur - prev
  const sign = diff >= 0 ? '+' : '-'
  return `${sign}${fmtSecs(Math.abs(diff))}`
})

const stayBuckets = computed(() => {
  const d = stayData.value
  if (!d || d.stayCount === 0) return []
  const total = d.stayCount || 1
  const buckets = [
    { label: '<5分钟',   count: d.under5Count   || 0, color: '#2d6fd6' },
    { label: '5-15分钟', count: d.mid5to15Count || 0, color: '#17a2b8' },
    { label: '>15分钟',  count: d.over15Count   || 0, color: '#e8842a' }
  ]
  const pcts   = buckets.map(b => Math.round((b.count / total) * 100))
  const maxPct = Math.max(...pcts, 1)
  return buckets.map((b, i) => ({
    ...b,
    pct:  pcts[i],
    barH: Math.max(8, Math.round((pcts[i] / maxPct) * 140))
  }))
})

// 停留分析的参数：跟随选中折线点（与 buildProfileParams 对齐）
function buildStayParams(idx) {
  const pt   = trendPoints.value[idx]
  if (!pt) return null
  const type  = tabs[activeTab.value].type
  const label = pt.timeLabel

  switch (type) {
    case 'hour': {
      const dateStr = label.split(' ')[0]
      const h       = parseInt(label.split(' ')[1])
      return { type: 'hour', start: dateStr, end: dateStr, hour: h }
    }
    case 'day':
      // 单日：hour 粒度，趋势为当天 24 小时分布
      return { type: 'hour', start: label, end: label }
    case 'week': {
      const d   = new Date(label)
      const sun = new Date(d.getTime() + 6 * 86400000)
      return { type: 'day', start: label, end: toISO(sun) }
    }
    case 'month': {
      const [y, mo] = label.split('-').map(Number)
      const last = new Date(y, mo, 0).getDate()
      return { type: 'day', start: `${label}-01`, end: `${label}-${String(last).padStart(2,'0')}` }
    }
  }
}

// ── 导出 ─────────────────────────────────────────────────────
function onExportClick() {
  if (packageType.value < 2) {
    uni.showToast({ title: '该功能仅限中级以上用户', icon: 'none', duration: 2500 })
    return
  }
  exportScope.value  = selectedIdx.value !== null ? 'both' : 'trend'
  exportFormat.value = 'excel'
  showExportSheet.value = true
}

async function doExport() {
  exporting.value = true
  try {
    const type = tabs[activeTab.value].type
    const p = { format: exportFormat.value, scope: exportScope.value, type }

    if (type === 'hour')      { p.start = selectedDate.value; p.end = selectedDate.value }
    else if (type === 'day')  { p.start = dateStart.value;    p.end = dateEnd.value }

    if (exportScope.value !== 'trend' && selectedIdx.value !== null) {
      const pp = buildProfileParams(selectedIdx.value)
      if (pp) {
        if (pp.startDt) { p.profileStartDt = pp.startDt; p.profileEndDt = pp.endDt }
        if (pp.start)   { p.profileStart   = pp.start;   p.profileEnd   = pp.end }
      }
    }

    const qs    = Object.entries(p).filter(([, v]) => v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
    const token = getToken()

    const res = await new Promise((resolve, reject) => {
      uni.downloadFile({
        url: `${BASE_URL}/api/merchant/export/trend?${qs}`,
        header: { Authorization: `Bearer ${token}` },
        success: resolve,
        fail:    reject
      })
    })

    if (res.statusCode === 200) {
      uni.openDocument({ filePath: res.tempFilePath, showMenu: true })
      showExportSheet.value = false
    } else {
      uni.showToast({ title: '导出失败', icon: 'none' })
    }
  } catch (_) {
    uni.showToast({ title: '导出失败，请重试', icon: 'none' })
  } finally {
    exporting.value = false
  }
}

async function loadStayAnalysis(idx) {
  const params = buildStayParams(idx)
  if (!params) { stayData.value = null; return }
  stayLoading.value = true
  stayActiveBar.value = -1
  stayData.value = null
  try {
    stayData.value = await get('/api/merchant/stay', params, { showLoad: false })
  } catch (_) {
    stayData.value = null
  } finally {
    stayLoading.value = false
  }
}
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

  .header-title {
    font-size: 34rpx;
    font-weight: 600;
    flex: 1;
  }

  .nav-export-btn {
    height: 56rpx;
    line-height: 56rpx;
    padding: 0 28rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.5);
    border-radius: 28rpx;
    font-size: 24rpx;
    color: #fff;

    &:active { opacity: 0.7; }
  }
}

/* ── 导出 BottomSheet ── */
.sheet-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.export-sheet {
  width: 100%;
  background: #fff;
  border-radius: 28rpx 28rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));

  .es-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #1a1a2e;
    text-align: center;
    margin-bottom: 36rpx;
  }

  .es-label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
    margin-top: 28rpx;
  }

  .es-opts {
    display: flex;
    gap: 16rpx;
  }

  .es-opt {
    flex: 1;
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    border: 2rpx solid #e0e6f0;
    border-radius: 16rpx;
    font-size: 26rpx;
    color: #666;
    background: #f8f9fc;

    &.selected {
      border-color: #1f4788;
      color: #1f4788;
      background: rgba(31, 71, 136, 0.07);
      font-weight: 600;
    }

    &:active { opacity: 0.75; }
  }

  .es-btn {
    display: block;
    margin-top: 40rpx;
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: linear-gradient(90deg, #1f4788, #2d6fd6);
    color: #fff;
    border-radius: 44rpx;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    text-align: center;

    &[disabled] { opacity: 0.5; }
  }
}

.scroll-area {
  flex: 1;
  min-height: 0;
  background: #f0f2f7;
}

/* ── ① Tab 切换 ── */
.tab-switch {
  display: flex;
  padding: 24rpx 32rpx 12rpx;

  button {
    flex: 1;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 24rpx;
    color: #666;
    background: #fff;
    border: 1rpx solid #e0e0e0;
    border-radius: 0;
    padding: 0;

    &:first-child { border-radius: 16rpx 0 0 16rpx; }
    &:last-child  { border-radius: 0 16rpx 16rpx 0; }

    &.active {
      background: #1f4788;
      color: #fff;
      border-color: #1f4788;
      font-weight: 600;
    }
  }
}

/* ── ④ 日期选择行 ── */
.date-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 32rpx 16rpx;
}

.date-btn {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 20rpx;
  background: #fff;
  border: 1rpx solid #dce3ef;
  border-radius: 14rpx;
  font-size: 24rpx;
  color: #1f4788;
  white-space: nowrap;

  &:active { opacity: 0.75; }
}

.date-sep {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
}

.date-range-tag {
  font-size: 20rpx;
  color: #999;
  background: #f0f2f7;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  white-space: nowrap;

  &.tag-warn {
    color: #e67c00;
    background: #fff3e0;
  }
}

.date-limit-tip {
  font-size: 20rpx;
  color: #bbb;
  white-space: nowrap;
  flex-shrink: 0;
}

.date-fixed {
  font-size: 22rpx;
  color: #999;
}

/* 摘要行 */
.summary-row {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx 16rpx;

  .summary-item {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    .si-val {
      font-size: 40rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .si-unit {
      font-size: 22rpx;
      font-weight: 400;
      color: #999;
      margin-left: 2rpx;
    }

    .si-label {
      font-size: 20rpx;
      color: #999;
      margin-top: 4rpx;
    }
  }
}

/* ── ②③⑤ 图表卡片 ── */
.chart-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 24rpx 24rpx 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.chart-card-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.chart-axis-hint {
  display: flex;
  justify-content: space-between;
  padding: 6rpx 8rpx 0;
  font-size: 20rpx;
  color: #bbb;
}

/* ② 对比切换按钮 */
.compare-area {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.compare-close {
  font-size: 24rpx;
  color: #999;
  padding: 4rpx 8rpx;
  &:active { opacity: 0.6; }
}

.compare-toggle {
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 20rpx;
  border: 1rpx solid #c8d6ef;
  border-radius: 24rpx;
  font-size: 22rpx;
  color: #1f4788;
  background: #f0f4fb;
  white-space: nowrap;

  &.active {
    background: #1f4788;
    color: #fff;
    border-color: #1f4788;
  }

  &:active { opacity: 0.75; }
}

/* ② 对比图例 */
.compare-legend {
  display: flex;
  gap: 24rpx;
  margin-bottom: 8rpx;
  padding-left: 4rpx;

  .cl-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 20rpx;
    color: #999;
  }

  .cl-line {
    width: 32rpx;
    height: 4rpx;
    border-radius: 2rpx;

    &.main-line    { background: #1f4788; }
    &.compare-line {
      background: rgba(160, 160, 170, 0.7);
      border-top: 2rpx dashed rgba(160, 160, 170, 0.7);
      background: none;
      height: 0;
      border-radius: 0;
    }
  }
}

.chart-placeholder {
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-text { font-size: 26rpx; color: #ccc; }
}


.chart-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #1f4788;
  background: rgba(31, 71, 136, 0.06);
  border-radius: 12rpx;
  margin-top: 14rpx;
  padding: 14rpx 20rpx;

  .chart-hint-icon { font-size: 24rpx; }

  &--active {
    color: #17794a;
    background: rgba(23, 121, 74, 0.07);
  }
}

/* section 标题 */
.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;

  .section-close {
    margin-left: auto;
    font-size: 28rpx;
    color: #bbb;
    font-weight: 400;
    padding: 0 4rpx;
  }
}

/* 画像快照 */
.profile-loading {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #ccc;
}

.profile-snapshot {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .ps-stat-row {
    display: flex;
    margin-bottom: 32rpx;

    .ps-stat {
      flex: 1;
      text-align: center;

      &:not(:last-child) { border-right: 1rpx solid #f0f0f0; }

      .ps-val   { font-size: 40rpx; font-weight: 700; color: #1a1a2e; }
      .ps-label { font-size: 20rpx; color: #999; margin-top: 4rpx; }
    }
  }

  .ps-section-label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 16rpx;
    font-weight: 500;
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
    font-size: 22rpx;
    margin-bottom: 32rpx;

    .gl-male   { color: #2d6fd6; }
    .gl-female { color: #d64a7a; }
    .gl-new    { color: #17794a; }
    .gl-return { color: #e8842a; }
  }

  .age-cols {
    display: flex;
    gap: 16rpx;
    margin-bottom: 32rpx;
    align-items: flex-end;

    .age-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;

      .ac-pct   { font-size: 22rpx; font-weight: 600; }
      .ac-bar   { width: 100%; border-radius: 6rpx 6rpx 0 0; }
      .ac-label { font-size: 18rpx; color: #bbb; }
    }
  }

  .attr-rows {
    margin-bottom: 24rpx;

    .attr-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 18rpx;

      &:last-child { margin-bottom: 0; }

      .ar-label {
        width: 100rpx;
        font-size: 22rpx;
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
        width: 60rpx;
        font-size: 22rpx;
        color: #999;
        text-align: right;
        flex-shrink: 0;
      }
    }
  }
}


.insight-wrap {
  margin-top: 28rpx;
}

.insight-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  background: linear-gradient(135deg, #4a6cf7, #6a3de8);
  color: #fff;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: none;
  &::after { border: none; }
  &[disabled] { opacity: 0.6; }
}

.insight-box {
  background: #f5f3ff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  border-left: 6rpx solid #6a3de8;
}

.insight-box-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.insight-box-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #4a2db0;
}

.insight-box-close {
  font-size: 24rpx;
  color: #999;
  padding: 4rpx 8rpx;
}

.insight-box-content {
  font-size: 24rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.tab-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}

/* ── ⑥ 停留时长分析独立卡片 ── */
.stay-section-title {
  padding-top: 24rpx;
}

.stay-analysis-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 28rpx 24rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.stay-summary-row {
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .stay-summary-cell {
    flex: 1;
    text-align: center;
  }

  .ssc-val {
    font-size: 36rpx;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1.2;
  }

  .ssc-delta {
    display: inline-block;
    font-size: 26rpx;
    font-weight: 700;
    padding: 4rpx 16rpx;
    border-radius: 20rpx;
    line-height: 1.4;

    &.delta-up      { color: #17794a; background: rgba(23,121,74,0.1); }
    &.delta-down    { color: #c62828; background: rgba(198,40,40,0.1); }
    &.delta-neutral { color: #999;    background: #f5f5f5; }
  }

  .ssc-label {
    font-size: 20rpx;
    color: #999;
    margin-top: 6rpx;
  }
}

.stay-dist-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 16rpx;
}

.stay-dist-bars {
  display: flex;
  gap: 16rpx;
  align-items: flex-end;
  height: 200rpx;
  margin-bottom: 8rpx;
  padding: 0 8rpx;
}

.sdb-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  position: relative;

  &:active { opacity: 0.75; }
}

.sdb-tip {
  position: absolute;
  bottom: calc(100% - 20rpx);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(26, 26, 46, 0.88);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 14rpx;
  border-radius: 10rpx;
  white-space: nowrap;
  z-index: 10;
}

.sdb-pct {
  font-size: 22rpx;
  font-weight: 600;
}

.sdb-bar-wrap {
  flex: 1;
  width: 60%;
  display: flex;
  align-items: flex-end;
}

.sdb-bar {
  width: 100%;
  border-radius: 8rpx 8rpx 0 0;
  min-height: 8rpx;
}

.sdb-label {
  font-size: 20rpx;
  color: #bbb;
  white-space: nowrap;
  margin-top: 4rpx;
}

.stay-empty {
  text-align: center;
  color: #ccc;
  font-size: 24rpx;
  padding: 48rpx 0;
}

</style>
