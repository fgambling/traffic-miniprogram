<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="back-btn" @click="uni.navigateBack()">‹</view>
        <view class="header-title">门店信息</view>
      </view>
      <view class="header-sub">录入后 AI 可生成更精准的经营建议</view>
    </view>

    <scroll-view scroll-y class="scroll-area" v-if="!loading">

      <!-- 店铺业态 -->
      <view class="section-card">
        <view class="section-head">🏪 店铺业态</view>
        <view class="section-tip">选择最符合您店铺的行业类型，帮助 AI 生成更精准建议</view>
        <view class="type-grid">
          <view
            v-for="t in businessTypes"
            :key="t.value"
            class="type-tag"
            :class="{ active: selectedTypeTag === t.value }"
            @click="onTypeTag(t.value)"
          >{{ t.label }}</view>
        </view>
        <input
          v-if="selectedTypeTag === '其他'"
          v-model="customType"
          class="type-custom-input"
          placeholder="请输入业态名称，如：宠物店"
          maxlength="20"
          @input="form.businessType = customType"
        />
      </view>

      <view class="section-card">
        <view class="section-head">🍽️ 菜单 / 商品</view>
        <view class="section-tip">列出主要商品或分类，AI 会结合客流数据给出备货建议</view>
        <textarea
          v-model="form.menu"
          class="big-input"
          placeholder="例：招牌奶茶、水果茶、甜品（提拉米苏、双皮奶）、咖啡系列..."
          :maxlength="500"
        />
        <view class="char-count">{{ (form.menu || '').length }}/500</view>
      </view>

      <view class="section-card">
        <view class="section-head">🎁 当期促销活动</view>
        <view class="section-tip">填写正在进行的活动，AI 会据此优化营销建议</view>
        <textarea
          v-model="form.promotions"
          class="big-input"
          placeholder="例：周一奶茶第二杯半价；满30减5；学生证9折..."
          :maxlength="300"
        />
        <view class="char-count">{{ (form.promotions || '').length }}/300</view>
      </view>

      <view class="section-card">
        <view class="section-head">🕐 营业时间</view>
        <textarea
          v-model="form.businessHours"
          class="big-input"
          placeholder="例：周一至周五 10:00-22:00，周末 09:00-23:00"
          :maxlength="200"
        />
      </view>

      <view class="section-card">
        <view class="section-head">👥 目标客群</view>
        <view class="section-tip">描述你的主要顾客群体，有助于 AI 精准推荐策略</view>
        <textarea
          v-model="form.targetAudience"
          class="big-input"
          placeholder="例：周边写字楼白领 + 大学生，18-35岁女性为主，偏好健康低糖饮品..."
          :maxlength="300"
        />
      </view>

      <button class="btn-save" @click="save" :disabled="saving">
        {{ saving ? '保存中...' : '保存门店信息' }}
      </button>

      <view class="bottom-spacer" />
    </scroll-view>

    <view v-else class="loading-wrap">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, put } from '../../utils/request.js'

const loading = ref(true)
const saving  = ref(false)
const form    = reactive({ businessType: '', menu: '', promotions: '', businessHours: '', targetAudience: '' })

const businessTypes = [
  { value: '餐饮', label: '🍜 餐饮' },
  { value: '商超', label: '🛒 商超' },
  { value: '服装', label: '👗 服装' },
  { value: '美妆', label: '💄 美妆' },
  { value: '数码', label: '📱 数码' },
  { value: '书店', label: '📚 书店' },
  { value: '健身', label: '💪 健身' },
  { value: '其他', label: '🏪 其他' }
]

const PRESET_VALUES   = businessTypes.filter(t => t.value !== '其他').map(t => t.value)
const selectedTypeTag = ref('')   // 当前高亮的 tag
const customType      = ref('')   // 选"其他"时用户输入的内容

function onTypeTag(val) {
  if (selectedTypeTag.value === val) {
    // 再次点击取消
    selectedTypeTag.value  = ''
    form.businessType      = ''
    customType.value       = ''
  } else {
    selectedTypeTag.value = val
    if (val !== '其他') {
      form.businessType = val
      customType.value  = ''
    } else {
      form.businessType = customType.value  // 先保持，输入后再同步
    }
  }
}

async function load() {
  try {
    const data = await get('/api/merchant/business-info', {}, { showLoad: false })
    if (data) {
      const bt = data.businessType || ''
      form.businessType = bt
      if (PRESET_VALUES.includes(bt)) {
        selectedTypeTag.value = bt
      } else if (bt) {
        selectedTypeTag.value = '其他'
        customType.value      = bt
      }
      form.menu           = data.menu           || ''
      form.promotions     = data.promotions     || ''
      form.businessHours  = data.businessHours  || ''
      form.targetAudience = data.targetAudience || ''
    }
  } catch (_) {}
  loading.value = false
}

async function save() {
  saving.value = true
  try {
    await put('/api/merchant/business-info', form)
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (_) {}
  saving.value = false
}

onMounted(load)
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f4f5f9; display: flex; flex-direction: column; }

.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 0 32rpx 24rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .back-btn { font-size: 48rpx; opacity: 0.8; padding: 0 8rpx; &:active { opacity: 0.5; } }
  .header-title { font-size: 34rpx; font-weight: 600; }
  .header-sub { font-size: 22rpx; opacity: 0.65; margin-top: 4rpx; }
}

.scroll-area { flex: 1; }

.section-card {
  background: #fff;
  margin: 20rpx 32rpx 0;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);

  .section-head {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 8rpx;
  }

  .section-tip {
    font-size: 22rpx;
    color: #aaa;
    margin-bottom: 16rpx;
    line-height: 1.5;
  }
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 8rpx;
}

.type-tag {
  padding: 14rpx 28rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  background: #f0f2f7;
  border: 2rpx solid transparent;

  &.active {
    color: #1f4788;
    background: rgba(31, 71, 136, 0.08);
    border-color: #1f4788;
    font-weight: 600;
  }

  &:active { opacity: 0.75; }
}

.type-custom-input {
  display: block;
  width: 100%;
  margin-top: 20rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #f0f2f7;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
  border: 2rpx solid #1f4788;
}

.big-input {
  width: 100%;
  min-height: 140rpx;
  background: #f6f7fa;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
  box-sizing: border-box;
}

.char-count {
  text-align: right;
  font-size: 20rpx;
  color: #ccc;
  margin-top: 8rpx;
}

.btn-save {
  display: block;
  margin: 32rpx 32rpx 0;
  width: calc(100% - 64rpx);
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

  &::after { display: none; }
  &[disabled] { opacity: 0.6; }
}

.bottom-spacer { height: 60rpx; }

.loading-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 28rpx;
}
</style>
