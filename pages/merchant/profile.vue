<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">用户画像</view>
      </view>
      <view class="header-sub">{{ headerSub }}</view>
    </view>

    <scroll-view class="scroll-area" scroll-y enable-flex>

      <!-- ⑦ 时段快速选项 -->
      <view class="date-tab">
        <button
          v-for="(d, i) in dateRanges"
          :key="i"
          :class="{ active: activeDateRange === i }"
          @click="switchDateRange(i)"
        >{{ d.label }}</button>
      </view>

      <!-- ⑦ 自定义日期范围选择器 -->
      <view v-if="activeDateRange === dateRanges.length - 1" class="custom-date-row">
        <picker mode="date" :value="customStart" :end="customEnd" @change="onCustomStartChange">
          <view class="date-btn">{{ customStart }}</view>
        </picker>
        <text class="date-sep">—</text>
        <picker mode="date" :value="customEnd" :start="customStart" :end="todayStr" @change="onCustomEndChange">
          <view class="date-btn">{{ customEnd }}</view>
        </picker>
        <text class="date-range-tag">{{ customDayCount }}天</text>
      </view>

      <!-- 加载中 / 无数据 占位 -->
      <view v-if="loading" class="empty-hint"><text>加载中…</text></view>
      <view v-else-if="!profileData" class="empty-hint"><text>暂无数据</text></view>

      <template v-else>

        <!-- ⑧ 客群构成：CSS性别环形 + 年龄分布 + 新老客 -->
        <view class="section-title">客群构成</view>
        <view class="composition-card">

          <!-- 性别 CSS 环形图 -->
          <view class="gender-block">
            <view class="gender-ring-wrap" @click="genderShowCount = !genderShowCount">
              <view class="gender-ring" :style="{ background: `conic-gradient(#2a5298 0% ${maleP}%, #d64a7a ${maleP}% 100%)` }">
              </view>
              <view class="gender-hole">
                <text class="gender-hole-label">{{ maleP > femaleP ? '男多' : maleP < femaleP ? '女多' : '均等' }}</text>
              </view>
            </view>
            <view class="gender-legend">
              <view class="gl-row">
                <view class="gl-dot" style="background:#2a5298;" />
                <text class="gl-label">男 {{ maleP }}%</text>
                <text v-if="genderShowCount" class="gl-count">{{ profileData.genderMale }}人</text>
              </view>
              <view class="gl-row">
                <view class="gl-dot" style="background:#d64a7a;" />
                <text class="gl-label">女 {{ femaleP }}%</text>
                <text v-if="genderShowCount" class="gl-count">{{ profileData.genderFemale }}人</text>
              </view>
            </view>
            <text class="click-hint">点击查看人数</text>
          </view>

          <!-- 年龄分布 -->
          <view class="age-block">
            <view class="age-title">年龄分布</view>
            <view v-for="ag in ageRows" :key="ag.label" class="age-row" @click="ag.showCount = !ag.showCount">
              <text class="age-row-label">{{ ag.label }}</text>
              <view class="age-row-bar-bg">
                <view class="age-row-bar-fill" :style="{ width: ag.pct + '%', background: ag.color }" />
              </view>
              <text class="age-row-val" :style="{ color: ag.color }">
                {{ ag.showCount ? ag.count + '人' : ag.pct + '%' }}
              </text>
            </view>

            <!-- 新老客 -->
            <view class="age-title" style="margin-top: 20rpx;">新老客</view>
            <view v-for="nc in newReturnRows" :key="nc.label" class="age-row" @click="nc.showCount = !nc.showCount">
              <text class="age-row-label">{{ nc.label }}</text>
              <view class="age-row-bar-bg">
                <view class="age-row-bar-fill" :style="{ width: nc.pct + '%', background: nc.color }" />
              </view>
              <text class="age-row-val" :style="{ color: nc.color }">
                {{ nc.showCount ? nc.count + '人' : nc.pct + '%' }}
              </text>
            </view>
          </view>
        </view>

        <!-- ⑤ 穿着风格（上衣类型 + 上衣风格） -->
        <view class="section-title">穿着风格（上衣）</view>
        <view class="bars-section">
          <view class="sub-label">上衣类型</view>
          <AttrBar v-for="item in styleData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
          <view class="divider" />
          <view class="sub-label">上衣风格</view>
          <AttrBar v-for="item in stylePatternData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
        </view>

        <!-- ⑤ 下装类型 + 下装风格 -->
        <view class="section-title">下装</view>
        <view class="bars-section">
          <view class="sub-label">下装类型</view>
          <AttrBar v-for="item in bottomData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
          <view class="divider" />
          <view class="sub-label">下装风格</view>
          <AttrBar v-for="item in bottomPatternData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
        </view>

        <!-- ⑧ 配饰 & 包袋 -->
        <view class="section-title">配饰 & 包袋</view>
        <view class="bars-section">
          <view class="sub-label">配饰</view>
          <AttrBar v-for="item in accessoryOnlyData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
          <view class="divider" />
          <view class="sub-label">包袋 & 持物</view>
          <AttrBar v-for="item in bagData" :key="item.label"
            :label="item.label" :value="item.value" :count="item.count" :color="item.color" />
        </view>

        <!-- 停留时长 -->
        <view class="section-title">停留时长</view>
        <view class="stay-card">
          <view class="stay-item">
            <view class="stay-val">{{ avgStayText }}</view>
            <view class="stay-label">平均停留</view>
          </view>
          <view class="stay-divider" />
          <view class="stay-item">
            <view class="stay-val">{{ profileData.stayCount }}</view>
            <view class="stay-label">有效记录人次</view>
          </view>
        </view>

        <!-- ⑨ 综合属性排行 -->
        <view class="section-title">
          综合属性排行
          <view class="sort-group">
            <view
              v-for="s in sortOptions"
              :key="s.key"
              class="sort-btn"
              :class="{ active: sortBy === s.key }"
              @click="sortBy = s.key; listPage = 0"
            >{{ s.label }}</view>
          </view>
        </view>
        <view class="list-card">
          <view v-for="(item, idx) in pagedAttributes" :key="item.label + item.category" class="list-row">
            <text class="lr-rank">{{ listPage * PAGE_SIZE + idx + 1 }}</text>
            <text class="lr-cat">{{ item.category }}</text>
            <text class="lr-label">{{ item.label }}</text>
            <view class="lr-bar-bg">
              <view class="lr-bar-fill" :style="{ width: item.value + '%', background: item.color }" />
            </view>
            <text class="lr-pct">{{ item.value }}%</text>
            <text class="lr-count">{{ item.count }}人</text>
          </view>

          <!-- 分页控制 -->
          <view class="page-row">
            <view class="page-btn" :class="{ disabled: listPage === 0 }" @click="prevPage">上页</view>
            <text class="page-info">{{ listPage + 1 }} / {{ totalPages }}</text>
            <view class="page-btn" :class="{ disabled: listPage >= totalPages - 1 }" @click="nextPage">下页</view>
          </view>
        </view>

      </template>

      <view class="bottom-spacer" />
    </scroll-view>

    <TabBar role="merchant" :current="2" />
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import AttrBar from '../../components/AttrBar.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get } from '../../utils/request.js'

// ── 日期工具 ─────────────────────────────────────────────────
function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const todayStr = toISODate(new Date())

// ── ⑦ 时段选项（含昨天 + 自定义） ───────────────────────────
const dateRanges = [
  { label: '今日',  days: 0  },
  { label: '昨天',  days: 1  },   // 新增
  { label: '近7天', days: 6  },
  { label: '本月',  days: -1 },
  { label: '自定义', days: -2 }  // 新增，-2 = 自定义
]

const activeDateRange = ref(0)
const loading         = ref(false)
const profileData     = ref(null)

// 自定义日期
const customStart = ref(toISODate(new Date(Date.now() - 6 * 86400000)))
const customEnd   = ref(todayStr)
const customDayCount = computed(() => {
  const diff = new Date(customEnd.value) - new Date(customStart.value)
  return Math.round(diff / 86400000) + 1
})

function onCustomStartChange(e) {
  customStart.value = e.detail.value
  loadProfile()
}
function onCustomEndChange(e) {
  customEnd.value = e.detail.value
  loadProfile()
}

function getRange(idx) {
  const today = new Date()
  const end = toISODate(today)
  const { days } = dateRanges[idx]
  if (days === 0) return { start: end, end }                          // 今日
  if (days === 1) {                                                    // 昨天
    const y = new Date(today); y.setDate(y.getDate() - 1)
    const yd = toISODate(y)
    return { start: yd, end: yd }
  }
  if (days === -1) {                                                   // 本月
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: toISODate(first), end }
  }
  if (days === -2) {                                                   // 自定义
    return { start: customStart.value, end: customEnd.value }
  }
  const startD = new Date(today); startD.setDate(today.getDate() - days)
  return { start: toISODate(startD), end }
}

// ── 数据加载 ─────────────────────────────────────────────────
async function loadProfile() {
  loading.value = true
  profileData.value = null
  try {
    const { start, end } = getRange(activeDateRange.value)
    profileData.value = await get('/api/merchant/profile', { start, end }) || null
  } catch (_) {
  } finally {
    loading.value = false
  }
}

function switchDateRange(i) {
  activeDateRange.value = i
  if (i === dateRanges.length - 1) return  // 自定义：等用户选日期后再加载
  loadProfile()
}

onMounted(() => {
  loadProfile()
})

// ── 工具 ─────────────────────────────────────────────────────
function pct(n, total) {
  if (!total || !n) return 0
  return Math.min(100, Math.round((n / total) * 100))
}

// ── 页头 ─────────────────────────────────────────────────────
const headerSub = computed(() => {
  const label = dateRanges[activeDateRange.value].label
  if (!profileData.value) return label
  return `${label} · ${profileData.value.totalEnter} 位顾客`
})

// ── ⑧ 性别 CSS 环形 ──────────────────────────────────────────
const maleP = computed(() => {
  const d = profileData.value
  if (!d) return 50
  const t = (d.genderMale || 0) + (d.genderFemale || 0)
  return t > 0 ? Math.round((d.genderMale / t) * 100) : 50
})
const femaleP = computed(() => 100 - maleP.value)
const genderShowCount = ref(false)

// ── ⑧ 年龄行（响应式，支持点击切换人数） ────────────────────
const ageRows = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  const p1 = pct(d.ageUnder18, total)
  const p2 = pct(d.age1860, total)
  const p3 = 100 - p1 - p2
  return [
    reactive({ label: '<18岁',   pct: p1, count: d.ageUnder18 || 0, color: '#e8842a', showCount: false }),
    reactive({ label: '18-60岁', pct: p2, count: d.age1860    || 0, color: '#2d6fd6', showCount: false }),
    reactive({ label: '>60岁',   pct: p3, count: d.ageOver60  || 0, color: '#9556cc', showCount: false })
  ]
})

const newReturnRows = computed(() => {
  const d = profileData.value
  if (!d) return []
  const total = d.totalEnter || 1
  return [
    reactive({ label: '新客',   pct: pct(d.newCustomerCount, total),      count: d.newCustomerCount      || 0, color: '#c62828', showCount: false }),
    reactive({ label: '回头客', pct: pct(d.returningCustomerCount, total), count: d.returningCustomerCount|| 0, color: '#17794a', showCount: false })
  ]
})

// ── ⑤ 穿着风格（上衣类型 + 上衣风格） ───────────────────────
const styleData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '短袖',  value: pct(d.upperShort, t), count: d.upperShort || 0, color: 'linear-gradient(90deg,#1a4a8a,#3a7ad6)' },
    { label: '长袖',  value: pct(d.upperLong,  t), count: d.upperLong  || 0, color: 'linear-gradient(90deg,#17794a,#22a965)' },
    { label: '长外套',value: pct(d.upperCoat,  t), count: d.upperCoat  || 0, color: 'linear-gradient(90deg,#b85c1a,#e8842a)' }
  ]
})

const stylePatternData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '条纹',  value: pct(d.upperStyleStripe, t), count: d.upperStyleStripe  || 0, color: '#5c6bc0' },
    { label: 'Logo款',value: pct(d.upperStyleLogo,   t), count: d.upperStyleLogo    || 0, color: '#0288d1' },
    { label: '格子',  value: pct(d.upperStylePlaid,  t), count: d.upperStylePlaid   || 0, color: '#00796b' },
    { label: '拼接',  value: pct(d.upperStyleSplice, t), count: d.upperStyleSplice  || 0, color: '#7b1fa2' }
  ]
})

// ── ⑤ 下装类型 + 下装风格 ────────────────────────────────────
const bottomData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '长裤',      value: pct(d.lowerTrousers, t), count: d.lowerTrousers || 0, color: '#37474f' },
    { label: '短裤',      value: pct(d.lowerShorts,   t), count: d.lowerShorts   || 0, color: '#00838f' },
    { label: '裙子/连衣裙', value: pct(d.lowerSkirt,  t), count: d.lowerSkirt    || 0, color: '#d64a7a' }
  ]
})

const bottomPatternData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '条纹', value: pct(d.lowerStyleStripe,  t), count: d.lowerStyleStripe  || 0, color: '#e65100' },
    { label: '图案', value: pct(d.lowerStylePattern, t), count: d.lowerStylePattern || 0, color: '#6d4c41' }
  ]
})

// ── ⑧ 配饰 & 包袋（拆分两组） ────────────────────────────────
const accessoryOnlyData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '眼镜', value: pct(d.accessoryGlasses, t), count: d.accessoryGlasses || 0, color: '#1a4a8a' },
    { label: '帽子', value: pct(d.accessoryHat,     t), count: d.accessoryHat     || 0, color: '#e8842a' },
    { label: '靴子', value: pct(d.accessoryBoots,   t), count: d.accessoryBoots   || 0, color: '#37474f' }
  ]
})

const bagData = computed(() => {
  const d = profileData.value; if (!d) return []
  const t = d.totalEnter || 1
  return [
    { label: '手提包',  value: pct(d.bagHandbag,  t), count: d.bagHandbag  || 0, color: '#c62828' },
    { label: '单肩包',  value: pct(d.bagShoulder, t), count: d.bagShoulder || 0, color: '#00838f' },
    { label: '背包',    value: pct(d.bagBackpack,  t), count: d.bagBackpack || 0, color: '#6b3399' },
    { label: '手持物品',value: pct(d.holdItem,     t), count: d.holdItem    || 0, color: '#795548' }
  ]
})

// ── 停留时长（简单展示） ──────────────────────────────────────
const avgStayText = computed(() => {
  const secs = profileData.value?.avgStaySeconds || 0
  if (!secs) return '--'
  if (secs < 60) return `${secs}秒`
  const m = Math.floor(secs / 60), s = secs % 60
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`
})

// ── ⑨ 综合属性排行 ───────────────────────────────────────────
const PAGE_SIZE = 20
const listPage = ref(0)
const sortBy   = ref('value-desc')

const sortOptions = [
  { key: 'value-desc', label: '高→低' },
  { key: 'value-asc',  label: '低→高' },
  { key: 'category',   label: '按类别' }
]

const allAttributes = computed(() => {
  const d = profileData.value
  if (!d) return []
  const t = d.totalEnter || 1
  return [
    { category: '性别',   label: '男性',    value: pct(d.genderMale,            t), count: d.genderMale            || 0, color: '#2a5298' },
    { category: '性别',   label: '女性',    value: pct(d.genderFemale,          t), count: d.genderFemale          || 0, color: '#d64a7a' },
    { category: '年龄',   label: '<18岁',   value: pct(d.ageUnder18,            t), count: d.ageUnder18            || 0, color: '#e8842a' },
    { category: '年龄',   label: '18-60岁', value: pct(d.age1860,               t), count: d.age1860               || 0, color: '#2d6fd6' },
    { category: '年龄',   label: '>60岁',   value: pct(d.ageOver60,             t), count: d.ageOver60             || 0, color: '#9556cc' },
    { category: '客群',   label: '新客',    value: pct(d.newCustomerCount,      t), count: d.newCustomerCount      || 0, color: '#c62828' },
    { category: '客群',   label: '回头客',  value: pct(d.returningCustomerCount,t), count: d.returningCustomerCount|| 0, color: '#17794a' },
    { category: '上衣类型', label: '短袖',  value: pct(d.upperShort,            t), count: d.upperShort            || 0, color: '#3a7ad6' },
    { category: '上衣类型', label: '长袖',  value: pct(d.upperLong,             t), count: d.upperLong             || 0, color: '#22a965' },
    { category: '上衣类型', label: '长外套',value: pct(d.upperCoat,             t), count: d.upperCoat             || 0, color: '#e8842a' },
    { category: '上衣风格', label: '条纹',  value: pct(d.upperStyleStripe,      t), count: d.upperStyleStripe      || 0, color: '#5c6bc0' },
    { category: '上衣风格', label: 'Logo款',value: pct(d.upperStyleLogo,        t), count: d.upperStyleLogo        || 0, color: '#0288d1' },
    { category: '上衣风格', label: '格子',  value: pct(d.upperStylePlaid,       t), count: d.upperStylePlaid       || 0, color: '#00796b' },
    { category: '上衣风格', label: '拼接',  value: pct(d.upperStyleSplice,      t), count: d.upperStyleSplice      || 0, color: '#7b1fa2' },
    { category: '下装类型', label: '长裤',  value: pct(d.lowerTrousers,         t), count: d.lowerTrousers         || 0, color: '#37474f' },
    { category: '下装类型', label: '短裤',  value: pct(d.lowerShorts,           t), count: d.lowerShorts           || 0, color: '#00838f' },
    { category: '下装类型', label: '裙子',  value: pct(d.lowerSkirt,            t), count: d.lowerSkirt            || 0, color: '#d64a7a' },
    { category: '下装风格', label: '条纹',  value: pct(d.lowerStyleStripe,      t), count: d.lowerStyleStripe      || 0, color: '#e65100' },
    { category: '下装风格', label: '图案',  value: pct(d.lowerStylePattern,     t), count: d.lowerStylePattern     || 0, color: '#6d4c41' },
    { category: '配饰',   label: '眼镜',    value: pct(d.accessoryGlasses,      t), count: d.accessoryGlasses      || 0, color: '#1a4a8a' },
    { category: '配饰',   label: '帽子',    value: pct(d.accessoryHat,          t), count: d.accessoryHat          || 0, color: '#e8842a' },
    { category: '配饰',   label: '靴子',    value: pct(d.accessoryBoots,        t), count: d.accessoryBoots        || 0, color: '#37474f' },
    { category: '包袋',   label: '手提包',  value: pct(d.bagHandbag,            t), count: d.bagHandbag            || 0, color: '#c62828' },
    { category: '包袋',   label: '单肩包',  value: pct(d.bagShoulder,           t), count: d.bagShoulder           || 0, color: '#00838f' },
    { category: '包袋',   label: '背包',    value: pct(d.bagBackpack,           t), count: d.bagBackpack           || 0, color: '#6b3399' },
    { category: '包袋',   label: '手持物品',value: pct(d.holdItem,              t), count: d.holdItem              || 0, color: '#795548' }
  ]
})

const sortedAttributes = computed(() => {
  const arr = [...allAttributes.value]
  if (sortBy.value === 'value-desc') return arr.sort((a, b) => b.value - a.value)
  if (sortBy.value === 'value-asc')  return arr.sort((a, b) => a.value - b.value)
  // 按类别：同类内按值降序
  return arr.sort((a, b) => a.category.localeCompare(b.category, 'zh') || b.value - a.value)
})

const totalPages = computed(() => Math.ceil(sortedAttributes.value.length / PAGE_SIZE))

const pagedAttributes = computed(() => {
  const s = listPage.value * PAGE_SIZE
  return sortedAttributes.value.slice(s, s + PAGE_SIZE)
})

function prevPage() { if (listPage.value > 0) listPage.value-- }
function nextPage() { if (listPage.value < totalPages.value - 1) listPage.value++ }
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

  .nav-bar { height: 88rpx; display: flex; align-items: center; }
  .header-title { font-size: 34rpx; font-weight: 600; }
  .header-sub   { font-size: 24rpx; opacity: 0.7; margin-top: 4rpx; }
}

.scroll-area {
  flex: 1;
  min-height: 0;
  background: #f4f5f9;
}

/* ⑦ 时段 Tab */
.date-tab {
  display: flex;
  padding: 24rpx 32rpx 12rpx;

  button {
    flex: 1;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 22rpx;
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

/* ⑦ 自定义日期行 */
.custom-date-row {
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

.date-sep { font-size: 24rpx; color: #999; }

.date-range-tag {
  font-size: 20rpx;
  color: #999;
  background: #f0f2f7;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  font-size: 26rpx;
  color: #ccc;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 24rpx 32rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* ⑧ 客群构成卡片 */
.composition-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  display: flex;
  gap: 28rpx;
}

/* 性别环形 */
.gender-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;

  .click-hint {
    font-size: 18rpx;
    color: #ccc;
    margin-top: 8rpx;
  }
}

.gender-ring-wrap {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 12rpx;
}

.gender-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
}

.gender-hole {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 70rpx; height: 70rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  .gender-hole-label { font-size: 18rpx; color: #666; font-weight: 600; }
}

.gender-legend {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  .gl-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .gl-dot {
    width: 16rpx; height: 16rpx;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .gl-label { font-size: 20rpx; color: #555; }
  .gl-count { font-size: 20rpx; color: #1f4788; font-weight: 600; margin-left: 4rpx; }
}

/* 年龄分布 */
.age-block {
  flex: 1;
  min-width: 0;

  .age-title {
    font-size: 22rpx;
    color: #999;
    font-weight: 500;
    margin-bottom: 10rpx;
  }
}

.age-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 10rpx;

  &:active { opacity: 0.75; }

  .age-row-label {
    width: 72rpx;
    font-size: 20rpx;
    color: #666;
    flex-shrink: 0;
  }

  .age-row-bar-bg {
    flex: 1;
    height: 12rpx;
    background: #f0f0f0;
    border-radius: 6rpx;
    overflow: hidden;

    .age-row-bar-fill {
      height: 100%;
      border-radius: 6rpx;
      transition: width 0.4s ease;
    }
  }

  .age-row-val {
    width: 60rpx;
    font-size: 20rpx;
    font-weight: 600;
    text-align: right;
    flex-shrink: 0;
  }
}

/* 属性条卡片 */
.bars-section {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

  .sub-label {
    font-size: 22rpx;
    color: #999;
    font-weight: 500;
    margin-bottom: 16rpx;
  }

  .divider {
    height: 1rpx;
    background: #f0f0f0;
    margin: 16rpx 0 20rpx;
  }
}

/* 停留时长简单卡片 */
.stay-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  display: flex;
  align-items: center;

  .stay-item {
    flex: 1;
    text-align: center;

    .stay-val {
      font-size: 44rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stay-label {
      font-size: 22rpx;
      color: #999;
      margin-top: 8rpx;
    }
  }

  .stay-divider {
    width: 1rpx;
    height: 80rpx;
    background: #eee;
    flex-shrink: 0;
  }
}

/* ⑨ 排行列表 */
.sort-group {
  display: flex;
  gap: 8rpx;
  margin-left: auto;

  .sort-btn {
    height: 44rpx;
    line-height: 44rpx;
    padding: 0 16rpx;
    border: 1rpx solid #dce3ef;
    border-radius: 22rpx;
    font-size: 20rpx;
    color: #666;
    font-weight: 400;

    &.active {
      background: #1f4788;
      color: #fff;
      border-color: #1f4788;
    }

    &:active { opacity: 0.75; }
  }
}

.list-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 8rpx 24rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.list-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-of-type { border-bottom: none; }

  .lr-rank {
    width: 36rpx;
    font-size: 20rpx;
    color: #ccc;
    text-align: center;
    flex-shrink: 0;
  }

  .lr-cat {
    width: 80rpx;
    font-size: 18rpx;
    color: #bbb;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lr-label {
    width: 80rpx;
    font-size: 22rpx;
    color: #444;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .lr-bar-bg {
    flex: 1;
    height: 12rpx;
    background: #f0f0f0;
    border-radius: 6rpx;
    overflow: hidden;

    .lr-bar-fill {
      height: 100%;
      border-radius: 6rpx;
    }
  }

  .lr-pct {
    width: 52rpx;
    font-size: 20rpx;
    color: #666;
    text-align: right;
    flex-shrink: 0;
  }

  .lr-count {
    width: 64rpx;
    font-size: 20rpx;
    color: #1f4788;
    font-weight: 600;
    text-align: right;
    flex-shrink: 0;
  }
}

/* 分页控制 */
.page-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  padding: 16rpx 0 4rpx;

  .page-btn {
    padding: 10rpx 28rpx;
    border: 1rpx solid #dce3ef;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: #1f4788;
    background: #f0f4fb;

    &.disabled { color: #ccc; background: #f5f5f5; border-color: #eee; }
    &:active:not(.disabled) { opacity: 0.75; }
  }

  .page-info { font-size: 22rpx; color: #999; }
}

.bottom-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}
</style>
