<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="back-btn" @click="goBack">‹</view>
        <view class="header-title">提醒建议</view>
      </view>
      <view class="header-sub">配置触发提醒建议的条件</view>
    </view>

    <!-- 内置规则 -->
    <view class="section-title">内置规则</view>
    <view v-if="builtinRules.length > 0" class="rule-list">
      <view v-for="rule in builtinRules" :key="rule.ruleId" class="rule-card">
        <view class="rc-main">
          <view class="rc-type-tag" :style="{ background: typeColor(rule.adviceType).tagBg, color: typeColor(rule.adviceType).color }">
            {{ rule.adviceType }}
          </view>
          <view class="rc-desc">{{ rule.description }}</view>
        </view>
        <switch
          :checked="rule.enabled"
          color="#1f4788"
          @change="toggleBuiltin(rule)"
        />
      </view>
    </view>
    <view v-else-if="!loading" class="empty-hint">暂无内置规则</view>

    <!-- 自定义规则 -->
    <view class="section-title">
      自定义规则
      <text class="section-action" @click="showAddSheet = true">+ 新增</text>
    </view>
    <view v-if="customRules.length > 0" class="rule-list">
      <view v-for="rule in customRules" :key="rule.ruleId" class="rule-card">
        <view class="rc-main">
          <view class="rc-type-tag" :style="{ background: typeColor(rule.adviceType).tagBg, color: typeColor(rule.adviceType).color }">
            {{ rule.adviceType }}
          </view>
          <view class="rc-name">{{ rule.name }}</view>
          <view class="rc-condition">{{ metricLabel(rule.metric) }} {{ rule.operator }} {{ rule.threshold }}</view>
        </view>
        <view class="rc-delete" @click="confirmDelete(rule)">删除</view>
      </view>
    </view>
    <view v-else-if="!loading" class="empty-hint">暂无自定义规则，点击上方"+ 新增"创建</view>

    <view class="bottom-spacer" />

    <!-- 新增自定义规则弹层 -->
    <BottomSheet :show="showAddSheet" title="新增自定义规则" @close="showAddSheet = false">
      <view class="form">
        <view class="form-item">
          <text class="form-label">规则名称 *</text>
          <input v-model="form.name" class="form-input" placeholder="如：周五甜点提醒" />
        </view>

        <view class="form-item">
          <text class="form-label">监控指标 *</text>
          <view class="picker-group">
            <view
              v-for="m in metricOptions"
              :key="m.value"
              class="picker-tag"
              :class="{ active: form.metric === m.value }"
              @click="form.metric = m.value"
            >{{ m.label }}</view>
          </view>
        </view>

        <view class="form-item">
          <view class="inline-row">
            <view class="inline-half">
              <text class="form-label">运算符</text>
              <view class="picker-group">
                <view
                  v-for="op in operators"
                  :key="op"
                  class="picker-tag small"
                  :class="{ active: form.operator === op }"
                  @click="form.operator = op"
                >{{ op }}</view>
              </view>
            </view>
            <view class="inline-half">
              <text class="form-label">阈值</text>
              <input v-model="form.threshold" class="form-input" type="digit" placeholder="0.6" />
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">建议类型</text>
          <view class="picker-group">
            <view
              v-for="t in adviceTypes"
              :key="t"
              class="picker-tag"
              :class="{ active: form.adviceType === t }"
              @click="form.adviceType = t"
            >{{ t }}</view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">建议内容 *</text>
          <textarea
            v-model="form.content"
            class="form-textarea"
            placeholder="触发后展示的建议文本..."
            :maxlength="300"
          />
        </view>

        <button class="btn-submit" @click="submitRule">确认添加</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, post, del } from '../../utils/request.js'

const loading = ref(true)
const builtinRules = ref([])
const customRules = ref([])
const showAddSheet = ref(false)

const typeColorMap = {
  '备货': { color: '#1a4a8a', tagBg: '#e4edfa' },
  '排班': { color: '#17794a', tagBg: '#e8f5e9' },
  '营销': { color: '#e8842a', tagBg: '#fff3e0' }
}
const defaultColor = { color: '#6b3399', tagBg: '#f3e5f5' }

function typeColor(type) {
  return typeColorMap[type] || defaultColor
}

const metricOptions = [
  { value: 'femaleRatio', label: '女性占比' },
  { value: 'maleRatio', label: '男性占比' },
  { value: 'ageUnder18Ratio', label: '<18岁占比' },
  { value: 'age1860Ratio', label: '18-60岁占比' },
  { value: 'ageOver60Ratio', label: '>60岁占比' },
  { value: 'totalEnterCount', label: '进店人数' },
  { value: 'glassesRatio', label: '眼镜占比' },
  { value: 'bagRatio', label: '背包占比' },
  { value: 'holdItemRatio', label: '手持物品占比' },
  { value: 'avgStaySeconds', label: '平均停留秒数' }
]

const operators = ['>', '<', '>=', '<=', '=']
const adviceTypes = ['营销', '排班', '备货']

function metricLabel(value) {
  return metricOptions.find(m => m.value === value)?.label || value
}

const form = ref({
  name: '',
  metric: 'femaleRatio',
  operator: '>',
  threshold: '',
  adviceType: '营销',
  content: ''
})

async function fetchRules() {
  try {
    const data = await get('/api/merchant/rules', {}, { showLoad: false })
    builtinRules.value = data.builtinRules || []
    customRules.value = data.customRules || []
  } catch (e) {
    // 403 = no permission, handled by request.js
  } finally {
    loading.value = false
  }
}

async function toggleBuiltin(rule) {
  const newEnabled = !rule.enabled
  try {
    await post('/api/merchant/rules/builtin/toggle', { ruleId: rule.ruleId, enabled: newEnabled }, { showLoad: false })
    rule.enabled = newEnabled
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function submitRule() {
  if (!form.value.name || !form.value.content || !form.value.threshold) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  try {
    const payload = {
      ruleId: `custom_${Date.now()}`,
      name: form.value.name,
      metric: form.value.metric,
      operator: form.value.operator,
      threshold: parseFloat(form.value.threshold),
      adviceType: form.value.adviceType,
      content: form.value.content
    }
    await post('/api/merchant/rules/custom', payload)
    uni.showToast({ title: '添加成功', icon: 'success' })
    showAddSheet.value = false
    form.value = { name: '', metric: 'femaleRatio', operator: '>', threshold: '', adviceType: '营销', content: '' }
    fetchRules()
  } catch (e) {
    // error already shown
  }
}

function confirmDelete(rule) {
  uni.showModal({
    title: '删除规则',
    content: `确定删除「${rule.name}」？`,
    confirmColor: '#c62828',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await del(`/api/merchant/rules/custom/${rule.ruleId}`)
        customRules.value = customRules.value.filter(r => r.ruleId !== rule.ruleId)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        // error already shown
      }
    }
  })
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.redirectTo({ url: '/pages/merchant/mine' })
  }
}

onMounted(() => {
  fetchRules()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f4f5f9;
}

.bottom-spacer {
  height: calc(96rpx + env(safe-area-inset-bottom) + 32rpx);
}

.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 32rpx 24rpx;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding-right: 200rpx;
    gap: 8rpx;
  }

  .back-btn {
    font-size: 48rpx;
    line-height: 1;
    opacity: 0.8;
    padding: 0 8rpx;

    &:active { opacity: 0.5; }
  }

  .header-title {
    font-size: 34rpx;
    font-weight: 600;
  }

  .header-sub {
    font-size: 24rpx;
    opacity: 0.7;
    margin-top: 4rpx;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .section-action {
    font-size: 26rpx;
    color: #1f4788;
    font-weight: 500;

    &:active { opacity: 0.7; }
  }
}

.rule-list {
  padding: 0 32rpx;
}

.rule-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 20rpx;

  .rc-main {
    flex: 1;
    min-width: 0;
  }

  .rc-type-tag {
    display: inline-block;
    padding: 4rpx 16rpx;
    border-radius: 16rpx;
    font-size: 20rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
  }

  .rc-desc {
    font-size: 26rpx;
    color: #333;
    line-height: 1.5;
  }

  .rc-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 4rpx;
  }

  .rc-condition {
    font-size: 22rpx;
    color: #999;
  }

  .rc-delete {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #c62828;
    padding: 8rpx 20rpx;
    border: 1rpx solid #fde0e0;
    border-radius: 16rpx;

    &:active { opacity: 0.7; }
  }
}

.empty-hint {
  text-align: center;
  font-size: 26rpx;
  color: #ccc;
  padding: 48rpx 0;
}

/* 表单 */
.form {
  .form-item {
    margin-bottom: 28rpx;
  }

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

  .form-textarea {
    width: 100%;
    min-height: 160rpx;
    background: #f4f5f9;
    border-radius: 20rpx;
    padding: 24rpx;
    font-size: 26rpx;
    color: #333;
    box-sizing: border-box;
  }

  .picker-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
  }

  .picker-tag {
    padding: 12rpx 24rpx;
    border-radius: 20rpx;
    background: #f0f0f0;
    color: #666;
    font-size: 24rpx;

    &.active {
      background: #e4edfa;
      color: #1a4a8a;
      font-weight: 600;
    }

    &.small {
      padding: 10rpx 20rpx;
      min-width: 64rpx;
      text-align: center;
    }
  }

  .inline-row {
    display: flex;
    gap: 20rpx;

    .inline-half {
      flex: 1;
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
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;
    margin-top: 12rpx;
  }
}
</style>
