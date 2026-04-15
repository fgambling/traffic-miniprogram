<template>
  <view class="tab-bar">
    <view
      v-for="(tab, i) in tabs"
      :key="i"
      class="tab-item"
      :class="{ active: current === i }"
      @click="onTab(tab, i)"
    >
      <text class="tab-icon">{{ tab.icon }}</text>
      <text class="tab-label">{{ tab.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, default: 'merchant' }, // 'merchant' | 'salesman'
  current: { type: Number, default: 0 }
})

const merchantTabs = [
  { label: '首页',   icon: '🏠', url: '/pages/merchant/dashboard' },
  { label: '趋势',   icon: '📊', url: '/pages/merchant/trend' },
  { label: '画像',   icon: '👤', url: '/pages/merchant/profile' },
  { label: 'AI建议', icon: '💡', url: '/pages/merchant/ai-advice' }
]

const salesmanTabs = [
  { label: '工作台', icon: '🖥', url: '/pages/salesman/dashboard' },
  { label: '商家',   icon: '🏪', url: '/pages/salesman/follow' },
  { label: '佣金',   icon: '💰', url: '/pages/salesman/commission' },
  { label: '我的',   icon: '⚙️', url: '' }
]

const tabs = computed(() =>
  props.role === 'merchant' ? merchantTabs : salesmanTabs
)

function onTab(tab, i) {
  if (i === props.current) return
  if (!tab.url) {
    uni.showToast({ title: '功能开发中', icon: 'none' })
    return
  }
  uni.redirectTo({ url: tab.url })
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 124rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.97);
  border-top: 1rpx solid #e8e8ec;
  display: flex;
  z-index: 100;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    color: #a0a0a8;
    transition: color 0.2s;

    &.active {
      color: #1f4788;

      .tab-label {
        font-weight: 600;
      }
    }

    .tab-icon {
      font-size: 40rpx;
      line-height: 1;
    }

    .tab-label {
      font-size: 20rpx;
    }
  }
}
</style>
