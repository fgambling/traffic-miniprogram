<template>
  <view class="attr-bar">
    <view class="ab-top">
      <text class="ab-label">{{ label }}</text>
      <text class="ab-val">{{ value }}%</text>
    </view>
    <view class="ab-track">
      <view class="ab-fill" :style="{ width: value + '%', background: color }" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: Number, default: 0 },
  color: { type: String, default: 'linear-gradient(90deg, #1a4a8a, #3a7ad6)' }
})
</script>

<style lang="scss" scoped>
.attr-bar {
  margin-bottom: 20rpx;

  .ab-top {
    display: flex;
    justify-content: space-between;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;

    .ab-val {
      font-weight: 500;
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
