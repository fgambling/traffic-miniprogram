<template>
  <view class="attr-bar" @click="toggle">
    <view class="ab-top">
      <text class="ab-label">{{ label }}</text>
      <!-- ⑧ 点击图例切换显示人数 / 百分比 -->
      <view class="ab-val-wrap">
        <text v-if="showCount && count > 0" class="ab-val count">{{ count }}人</text>
        <text v-else class="ab-val">{{ value }}%</text>
      </view>
    </view>
    <view class="ab-track">
      <view class="ab-fill" :style="{ width: value + '%', background: color }" />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },   // 百分比 0-100
  count: { type: Number, default: 0 },   // 原始人数
  color: { type: String, default: 'linear-gradient(90deg, #1a4a8a, #3a7ad6)' }
})

const showCount = ref(false)
function toggle() { showCount.value = !showCount.value }
</script>

<style lang="scss" scoped>
.attr-bar {
  margin-bottom: 20rpx;

  &:active { opacity: 0.8; }

  .ab-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;

    .ab-val-wrap { flex-shrink: 0; }

    .ab-val {
      font-weight: 500;
      color: #444;

      &.count {
        color: #1f4788;
        font-weight: 600;
      }
    }
  }

  .ab-track {
    height: 16rpx;
    background: #eee;
    border-radius: 8rpx;
    overflow: hidden;

    .ab-fill {
      height: 100%;
      border-radius: 8rpx;
      transition: width 0.5s ease;
    }
  }
}
</style>
