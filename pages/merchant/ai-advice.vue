<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">AI 经营建议</view>
        <view class="pkg-badge" :class="pkgBadgeClass">{{ pkgBadgeText }}</view>
      </view>
      <view class="header-sub">{{ headerSubText }}</view>
    </view>

    <!-- ───── 普通版：模糊占位 + 升级遮罩 ───── -->
    <template v-if="packageType === 1">
      <view class="locked-wrap">
        <view
          v-for="placeholder in lockedPlaceholders"
          :key="placeholder.type"
          class="locked-card"
          :style="{ borderLeftColor: placeholder.color }"
        >
          <view class="ac-tags">
            <view class="ac-tag" :style="{ background: placeholder.tagBg, color: placeholder.color }">
              {{ placeholder.type }}
            </view>
          </view>
          <view class="ac-desc blurred">{{ placeholder.text }}</view>
          <view class="ac-time blurred">{{ placeholder.time }}</view>
        </view>

        <view class="lock-overlay">
          <view class="lock-icon">🔒</view>
          <view class="lock-title">解锁 AI 经营建议</view>
          <view class="lock-desc">
            升级中级版即可查看基于规则引擎的实时建议，涵盖备货、排班、营销三大维度
          </view>
          <button class="btn-upgrade" @click="goUpgrade">立即升级</button>
        </view>
      </view>
    </template>

    <!-- ───── 高级版：规则引擎 + AI 大模型双 Tab ───── -->
    <template v-else-if="packageType === 3">
      <!-- 来源 Tab -->
      <view class="source-tab-switch">
        <view
          class="source-tab"
          :class="{ active: sourceTab === 1 }"
          @click="switchSourceTab(1)"
        >AI 大模型</view>
        <view
          class="source-tab"
          :class="{ active: sourceTab === 0 }"
          @click="switchSourceTab(0)"
        >规则引擎</view>
      </view>

      <!-- 规则引擎 Tab：类型筛选 -->
      <view v-if="sourceTab === 0" class="tab-switch">
        <button
          v-for="(t, i) in filterTabs"
          :key="i"
          :class="{ active: activeFilter === i }"
          @click="activeFilter = i"
        >{{ t }}</button>
      </view>

      <view v-if="advices.length > 0">
        <view
          v-for="advice in advices"
          :key="advice.id"
          class="advice-card"
          :style="{ borderLeftColor: advice.color }"
          @click="openDetail(advice)"
        >
          <view class="ac-tags">
            <view class="ac-tag" :style="{ background: advice.tagBg, color: advice.color }">
              {{ advice.adviceType }}
            </view>
            <view v-if="sourceTab === 1" class="ac-ai-tag">✨ AI</view>
          </view>
          <view class="ac-desc">{{ advice.content }}</view>
          <view class="ac-time">{{ advice.createdAt }}</view>
        </view>
      </view>
      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">{{ sourceTab === 1 ? '✨' : '💡' }}</text>
        <text class="empty-title">暂无{{ sourceTab === 1 ? 'AI 大模型' : '规则引擎' }}建议</text>
        <text class="empty-sub">{{ sourceTab === 1 ? '点击右下角按钮立即生成' : '系统每 15 分钟自动检测并生成建议' }}</text>
      </view>
      <view v-if="hasMore && advices.length > 0" class="load-more" @click="loadMore">
        <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
      </view>

      <view v-if="sourceTab === 1" class="fab" @click="onFabClick">⚡</view>
    </template>

    <!-- ───── 中级版：规则引擎建议列表 ───── -->
    <template v-else>
      <view class="tab-switch">
        <button
          v-for="(t, i) in filterTabs"
          :key="i"
          :class="{ active: activeFilter === i }"
          @click="activeFilter = i"
        >{{ t }}</button>
      </view>

      <view v-if="advices.length > 0">
        <view
          v-for="advice in advices"
          :key="advice.id"
          class="advice-card"
          :style="{ borderLeftColor: advice.color }"
          @click="openDetail(advice)"
        >
          <view class="ac-tags">
            <view class="ac-tag" :style="{ background: advice.tagBg, color: advice.color }">
              {{ advice.adviceType }}
            </view>
          </view>
          <view class="ac-desc">{{ advice.content }}</view>
          <view class="ac-time">{{ advice.createdAt }}</view>
        </view>
      </view>

      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">💡</text>
        <text class="empty-title">暂无该类型建议</text>
        <text class="empty-sub">系统每 15 分钟自动检测并生成建议</text>
      </view>

      <view v-if="hasMore && advices.length > 0" class="load-more" @click="loadMore">
        <text>{{ loadingMore ? '加载中...' : '加载更多' }}</text>
      </view>
    </template>

    <view class="bottom-spacer" />
    <TabBar role="merchant" :current="2" />

    <!-- 建议详情弹层 -->
    <BottomSheet
      :show="showDetailSheet"
      :title="(currentAdvice?.adviceType || '') + '建议'"
      @close="showDetailSheet = false"
    >
      <view v-if="currentAdvice" class="detail-body">
        <view class="detail-content">{{ currentAdvice.content }}</view>
        <view class="feedback-row">
          <button
            class="fb-btn"
            :class="{ done: currentAdvice.feedback === 1 }"
            @click="sendFeedback(currentAdvice, 1)"
          >{{ currentAdvice.feedback === 1 ? '✅ 已反馈' : '👍 有用' }}</button>
          <button
            class="fb-btn fb-neg"
            :class="{ done: currentAdvice.feedback === 2 }"
            @click="sendFeedback(currentAdvice, 2)"
          >{{ currentAdvice.feedback === 2 ? '✅ 已反馈' : '👎 无用' }}</button>
        </view>
      </view>
    </BottomSheet>

    <!-- 生成弹层 -->
    <BottomSheet :show="showGenSheet" title="生成经营建议" @close="showGenSheet = false">
      <view class="gen-body">
        <text class="gen-desc">
          {{ packageType === 3 && sourceTab === 1
            ? '系统将调用 AI 大模型，结合您的客流数据与门店信息，生成个性化经营建议。'
            : '系统将基于最新客流数据，自动匹配内置规则，为您生成备货、排班与营销建议。' }}
        </text>
        <!-- 高级版 AI 大模型：选择数据范围 + 剩余次数 -->
        <template v-if="packageType === 3 && sourceTab === 1">
          <view class="gen-mode-label">分析范围</view>
          <view class="gen-mode-opts">
            <view class="gen-mode-opt"
              :class="{ active: genMode === 'today', disabled: rangeAvail.today === false }"
              @click="rangeAvail.today !== false && (genMode = 'today')">
              <text class="gmo-title">当日建议</text>
              <text class="gmo-sub">{{ rangeAvail.today === false ? '今日暂无客流数据' : '分析今日全天客流数据' }}</text>
            </view>
            <view class="gen-mode-opt"
              :class="{ active: genMode === 'lastHour', disabled: rangeAvail.lastHour === false }"
              @click="rangeAvail.lastHour !== false && (genMode = 'lastHour')">
              <text class="gmo-title">过去一小时</text>
              <text class="gmo-sub">{{ rangeAvail.lastHour === false ? '过去一小时暂无客流数据' : '分析最近1小时实时数据' }}</text>
            </view>
          </view>
          <view v-if="dailyRemain !== null" class="gen-remain" :class="{ 'gen-remain-warn': dailyRemain === 0 }">
            {{ dailyRemain === 0 ? '今日生成次数已用完' : `今日剩余生成次数：${dailyRemain} 次` }}
          </view>
        </template>
        <button class="btn-gen"
          :disabled="(packageType === 3 && sourceTab === 1 && (!genMode || dailyRemain === 0))"
          @click="generateAdvice">立即生成</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, post } from '../../utils/request.js'

// ── 类型色彩映射 ──────────────────────────────────────────────
const typeColorMap = {
  备货: { color: '#1a4a8a', tagBg: '#e4edfa' },
  排班: { color: '#17794a', tagBg: '#e8f5e9' },
  营销: { color: '#e8842a', tagBg: '#fff3e0' },
  服务: { color: '#6b3399', tagBg: '#f3e5f5' },
}
const defaultColor = { color: '#666', tagBg: '#f5f5f5' }

// ── 套餐：1=普通 2=中级 3=高级 ───────────────────────────────
const packageType = ref(1)

const pkgBadgeText = computed(() => ['', '普通版', '中级版', '高级版'][packageType.value] || '中级版')
const pkgBadgeClass = computed(() => ['', 'badge-basic', 'badge-mid', 'badge-advanced'][packageType.value] || 'badge-mid')
const headerSubText = computed(() => {
  if (packageType.value === 1) return '升级中级版即可解锁智能经营建议'
  if (packageType.value === 3) return '规则建议 + AI 大模型'
  return '基于规则引擎的实时经营建议'
})

// ── 普通版三种占位卡 ──────────────────────────────────────────
const lockedPlaceholders = [
  {
    type: '备货',
    color: '#1a4a8a', tagBg: '#e4edfa',
    text: '当前时段女性顾客比例较高（约66%），建议推送甜品/低卡饮品优惠活动。',
    time: '14:30',
  },
  {
    type: '排班',
    color: '#17794a', tagBg: '#e8f5e9',
    text: '本时段客流量超过历史同期均值 1.5 倍，建议增加收银人手、提前备餐。',
    time: '12:05',
  },
  {
    type: '营销',
    color: '#e8842a', tagBg: '#fff3e0',
    text: '连续 3 天同一时段客流下降超 20%，建议推出限时优惠或联名活动吸引客流。',
    time: '09:00',
  },
]

// ── 列表状态 ──────────────────────────────────────────────────
const filterTabs    = ['全部', '备货', '排班', '营销', '服务']
const filterTypeMap = { 1: '备货', 2: '排班', 3: '营销', 4: '服务' }
const activeFilter  = ref(0)
const sourceTab     = ref(1)   // 高级版：0=规则引擎(source=1)  1=AI大模型(source=2)
const showDetailSheet = ref(false)
const showGenSheet    = ref(false)
const llmAvailable    = ref(false)
const genMode         = ref('')       // '' | 'today' | 'lastHour'，默认不选
const dailyRemain     = ref(null)     // null=无限制, 数字=剩余次数
const rangeAvail      = ref({ today: null, lastHour: null })  // null=加载中
const currentAdvice   = ref(null)
const loading         = ref(true)
const loadingMore     = ref(false)
const advices  = ref([])
const page     = ref(1)
const pageSize = 10
const total    = ref(0)
const hasMore  = ref(false)

// ── 套餐信息 ──────────────────────────────────────────────────
async function fetchPackage() {
  try {
    const data = await get('/api/merchant/dashboard', {}, { showLoad: false })
    if (data?.packageType) packageType.value = data.packageType
  } catch (_) {}
}

function goUpgrade() {
  uni.showToast({ title: '请联系管理员升级套餐', icon: 'none', duration: 2500 })
}

// ── 建议列表 ──────────────────────────────────────────────────
function enrichItem(item) {
  const colors = typeColorMap[item.adviceType] || defaultColor
  return { ...item, ...colors, feedback: item.feedback || 0 }
}

async function fetchList(reset = false) {
  if (packageType.value === 1) { loading.value = false; return }
  if (reset) { page.value = 1; advices.value = [] }
  const params = { page: page.value, size: pageSize }
  if (packageType.value === 3) params.source = sourceTab.value === 1 ? 2 : 1
  if (sourceTab.value === 0 && activeFilter.value > 0) params.type = filterTypeMap[activeFilter.value]
  try {
    const data = await get('/api/merchant/advice/list', params, { showLoad: reset })
    const items = (data.list || []).map(enrichItem)
    advices.value = reset ? items : [...advices.value, ...items]
    total.value   = data.total || 0
    hasMore.value = advices.value.length < total.value
  } catch (_) {
  } finally {
    loading.value     = false
    loadingMore.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value++
  await fetchList(false)
}

watch(activeFilter, () => { loading.value = true; fetchList(true) })
watch(sourceTab,    () => { activeFilter.value = 0; loading.value = true; fetchList(true) })

onMounted(async () => {
  await fetchPackage()
  fetchList(true)
  if (packageType.value === 3) {
    try {
      const ok = await get('/api/merchant/advice/llm-available', {}, { showLoad: false })
      llmAvailable.value = !!ok
    } catch (_) {}
  }
})

// ── 交互 ──────────────────────────────────────────────────────
function switchSourceTab(idx) {
  if (sourceTab.value === idx) return
  sourceTab.value = idx
}

function openDetail(advice) {
  currentAdvice.value  = advice
  showDetailSheet.value = true
}


function sendFeedback(advice, type) {
  if (advice.feedback) return
  advice.feedback = type
  post('/api/merchant/advice/feedback', { id: advice.id, feedback: type }, { showLoad: false }).catch(() => {})
  uni.showToast({ title: '感谢反馈', icon: 'success' })
}

async function onFabClick() {
  if (packageType.value === 3 && sourceTab.value === 1) {
    if (!llmAvailable.value) {
      uni.showToast({ title: '管理员尚未配置大模型，请联系管理员', icon: 'none', duration: 2500 })
      return
    }
    genMode.value = ''
    rangeAvail.value = { today: null, lastHour: null }
    // 并行拉取：数据可用性 + 剩余次数
    const [checkRes, remainRes] = await Promise.allSettled([
      get('/api/merchant/advice/data-check', {}, { showLoad: false }),
      get('/api/merchant/advice/daily-remain', {}, { showLoad: false })
    ])
    rangeAvail.value = checkRes.status === 'fulfilled'
      ? checkRes.value
      : { today: true, lastHour: true }  // 接口失败时不限制
    dailyRemain.value = remainRes.status === 'fulfilled' && remainRes.value.remain !== -1
      ? remainRes.value.remain
      : null
  }
  showGenSheet.value = true
}

function generateAdvice() {
  const isLlm = packageType.value === 3 && sourceTab.value === 1
  const mode  = isLlm ? genMode.value : 'today'
  showGenSheet.value = false
  uni.showToast({ title: '正在生成，请稍候...', icon: 'loading', duration: 90000 })
  post(`/api/merchant/advice/generate?mode=${mode}`, {}, { showLoad: false, timeout: 120000 })
    .then(() => {
      uni.hideToast()
      uni.showToast({ title: '生成成功', icon: 'success', duration: 1500 })
      setTimeout(() => fetchList(true), 1500)
    })
    .catch(err => {
      uni.hideToast()
      const msg = err?.message || err?.msg || '生成失败，请稍后重试'
      uni.showToast({ title: msg, icon: 'none', duration: 3000 })
    })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f4f5f9;
}

.bottom-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}

/* ── 顶部 Header ── */
.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 32rpx 24rpx;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .header-title { font-size: 34rpx; font-weight: 600; }

  .pkg-badge {
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-radius: 16rpx;
    font-weight: 500;
    &.badge-basic    { background: rgba(255,255,255,0.18); color: #fff; }
    &.badge-mid      { background: rgba(255,207,64,0.95);  color: #5a3700; }
    &.badge-advanced { background: linear-gradient(135deg,#ff8a00,#e52e71); color:#fff; }
  }

  .header-sub { font-size: 24rpx; opacity: 0.7; margin-top: 4rpx; }
}

/* ── 高级版来源 Tab ── */
.source-tab-switch {
  display: flex;
  margin: 20rpx 32rpx 0;
  background: #eef1f8;
  border-radius: 20rpx;
  padding: 6rpx;
  gap: 0;

  .source-tab {
    flex: 1;
    height: 64rpx;
    line-height: 64rpx;
    text-align: center;
    font-size: 26rpx;
    color: #888;
    border-radius: 16rpx;
    transition: all .2s;

    &.active {
      background: #fff;
      color: #1f4788;
      font-weight: 600;
      box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
    }

    &:active { opacity: 0.75; }
  }
}

.ac-ai-tag {
  font-size: 18rpx;
  padding: 3rpx 12rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #7b2ff7, #4a90e2);
  color: #fff;
  font-weight: 500;
}

/* ── Tab 筛选条 ── */
.tab-switch {
  display: flex;
  padding: 20rpx 32rpx 4rpx;
  gap: 16rpx;

  button {
    flex: 1;
    height: 64rpx;
    border-radius: 16rpx;
    font-size: 24rpx;
    background: #fff;
    color: #888;
    border: 1rpx solid #e8e8e8;
    line-height: 64rpx;
    padding: 0;
    box-sizing: border-box;

    &.active {
      background: #1f4788;
      color: #fff;
      border-color: #1f4788;
      font-weight: 600;
    }

    &::after { display: none; }
  }
}

/* ── 建议卡片（中级 / 高级版） ── */
.advice-card {
  background: #fff;
  border-radius: 24rpx;
  margin: 20rpx 32rpx 0;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  border-left: 6rpx solid transparent;

  &:active { opacity: 0.85; }

  .ac-tags {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 14rpx;
  }

  .ac-tag {
    padding: 5rpx 18rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    font-weight: 600;
  }

  .ac-desc {
    font-size: 26rpx;
    color: #333;
    line-height: 1.65;
    margin-bottom: 12rpx;
  }

  .ac-time { font-size: 20rpx; color: #bbb; }
}

/* ── 空状态 ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;

  .empty-icon  { font-size: 80rpx; margin-bottom: 20rpx; opacity: 0.35; }
  .empty-title { font-size: 28rpx; color: #999; font-weight: 500; margin-bottom: 10rpx; }
  .empty-sub   { font-size: 24rpx; color: #ccc; }
}

/* ── 加载更多 ── */
.load-more {
  text-align: center;
  padding: 28rpx 0 8rpx;
  font-size: 24rpx;
  color: #1f4788;
  &:active { opacity: 0.7; }
}

/* ── FAB ── */
.fab {
  position: fixed;
  right: 40rpx;
  bottom: 190rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  box-shadow: 0 8rpx 28rpx rgba(31,71,136,0.38);
  z-index: 50;
  &:active { opacity: 0.85; }
}

/* ══════════════════════════════════════════════
   普通版：模糊占位 + 升级遮罩
══════════════════════════════════════════════ */
.locked-wrap {
  position: relative;
  padding: 20rpx 0 8rpx;
  min-height: 680rpx;

  .locked-card {
    background: #fff;
    border-radius: 24rpx;
    margin: 0 32rpx 20rpx;
    padding: 28rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
    border-left: 6rpx solid #1a4a8a;

    .ac-tags {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 14rpx;
    }
    .ac-tag {
      padding: 5rpx 18rpx;
      border-radius: 20rpx;
      font-size: 20rpx;
      font-weight: 600;
    }
    .ac-desc { font-size: 26rpx; color: #333; line-height: 1.65; }
    .ac-time  { font-size: 20rpx; color: #bbb; margin-top: 12rpx; }
    .blurred  { filter: blur(5rpx); user-select: none; pointer-events: none; }
  }

  .lock-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(244,245,249,0.55) 0%,
      rgba(244,245,249,0.94) 28%,
      rgba(244,245,249,0.99) 100%
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48rpx 56rpx;
    text-align: center;

    .lock-icon  { font-size: 72rpx; margin-bottom: 20rpx; }
    .lock-title { font-size: 32rpx; color: #1a1a2e; font-weight: 600; margin-bottom: 14rpx; }
    .lock-desc  { font-size: 24rpx; color: #888; line-height: 1.65; margin-bottom: 40rpx; }

    .btn-upgrade {
      width: 100%;
      max-width: 480rpx;
      height: 84rpx;
      border-radius: 22rpx;
      background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
      color: #fff;
      font-size: 28rpx;
      font-weight: 600;
      border: none;
      line-height: 84rpx;
      box-sizing: border-box;
      padding: 0;
    }
  }
}


/* ── 详情弹层 ── */
.detail-body {
  .detail-content {
    font-size: 26rpx;
    color: #333;
    line-height: 1.8;
    margin-bottom: 24rpx;
    white-space: pre-line;
  }

  .feedback-row {
    display: flex;
    gap: 20rpx;

    .fb-btn {
      flex: 1;
      height: 80rpx;
      border-radius: 20rpx;
      background: #f4f5f9;
      color: #333;
      font-size: 26rpx;
      border: 1rpx solid #e0e0e0;
      line-height: 80rpx;
      box-sizing: border-box;
      padding: 0;
      &.done { opacity: 0.5; }
    }
  }
}

/* ── 生成弹层 ── */
.gen-body {
  .gen-mode-label {
    font-size: 26rpx;
    color: #666;
    margin: 28rpx 0 16rpx;
  }

  .gen-mode-opts {
    display: flex;
    gap: 16rpx;
    margin-bottom: 8rpx;
  }

  .gen-mode-opt {
    flex: 1;
    padding: 24rpx 20rpx;
    border-radius: 16rpx;
    border: 2rpx solid #e0e6f0;
    background: #f8f9fc;

    &.active {
      border-color: #1f4788;
      background: rgba(31, 71, 136, 0.06);
      .gmo-title { color: #1f4788; font-weight: 600; }
    }

    &.disabled {
      opacity: 0.45;
      .gmo-sub { color: #e6a23c; }
    }

    &:active { opacity: 0.75; }

    .gmo-title { display: block; font-size: 28rpx; color: #333; margin-bottom: 8rpx; }
    .gmo-sub   { display: block; font-size: 22rpx; color: #aaa; }
  }

  .gen-desc {
    font-size: 26rpx;
    color: #666;
    line-height: 1.7;
    display: block;
    margin-bottom: 32rpx;
  }

  .gen-remain {
    margin-top: 20rpx;
    font-size: 24rpx;
    color: #17794a;
    text-align: center;
    &.gen-remain-warn {
      color: #e6a23c;
      font-weight: 600;
    }
  }

  .btn-gen {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
    &[disabled] {
      background: #c8c9cc;
      opacity: 1;
    }
  }
}
</style>
