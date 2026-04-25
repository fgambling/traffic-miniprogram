<template>
  <view class="tab-bar">
    <view
      v-for="(tab, i) in tabs"
      :key="i"
      class="tab-item"
      :class="{ active: current === i }"
      @click="onTab(tab, i)"
    >
      <view class="active-dot" v-if="current === i" />
      <view class="icon-wrap" :class="{ 'icon-wrap--active': current === i }">
        <text class="tab-icon">{{ tab.icon }}</text>
      </view>
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
  { label: 'AI建议', icon: '💡', url: '/pages/merchant/ai-advice' },
  { label: '我的',   icon: '⚙️', url: '/pages/merchant/mine' }
]

const salesmanTabs = [
  { label: '工作台', icon: '🖥', url: '/pages/salesman/dashboard' },
  { label: '商家',   icon: '🏪', url: '/pages/salesman/follow' },
  { label: '佣金',   icon: '💰', url: '/pages/salesman/commission' },
  { label: '我的',   icon: '⚙️', url: '/pages/salesman/mine' }
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
  height: 96rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  display: flex;
  z-index: 100;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    color: #b0b0bc;
    position: relative;
    transition: color 0.2s;

    &.active {
      color: #1f4788;

      .tab-label {
        font-weight: 600;
      }
    }

    &:active {
      opacity: 0.7;
    }
  }

  .active-dot {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32rpx;
    height: 6rpx;
    background: linear-gradient(90deg, #1a4a8a, #2d6fd6);
    border-radius: 0 0 4rpx 4rpx;
  }

  .icon-wrap {
    width: 56rpx;
    height: 56rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    transition: background 0.2s;

    &--active {
      background: rgba(31, 71, 136, 0.08);
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
</style>
