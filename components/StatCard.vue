<template>
  <view class="stat-card" :class="`c${color}`" @click="$emit('click')">
    <!-- 装饰圆 -->
    <view class="deco-circle" />
    <view class="label">{{ label }}</view>
    <view class="val">{{ value }}</view>
    <view class="delta" v-if="delta">{{ delta }}</view>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  value: { type: String, default: '' },
  delta: { type: String, default: '' },
  color: { type: Number, default: 1 } // 1=蓝 2=绿 3=橙 4=紫
})
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.stat-card {
  border-radius: 28rpx;
  padding: 28rpx 28rpx 24rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);

  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  .deco-circle {
    position: absolute;
    right: -24rpx;
    bottom: -24rpx;
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }

  .label {
    font-size: 22rpx;
    opacity: 0.8;
    font-weight: 500;
    letter-spacing: 0.5rpx;
  }

  .val {
    font-size: 56rpx;
    font-weight: 700;
    margin: 10rpx 0 6rpx;
    letter-spacing: -1rpx;
    line-height: 1.1;
  }

  .delta {
    font-size: 20rpx;
    opacity: 0.72;
    background: rgba(255, 255, 255, 0.15);
    display: inline-block;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
  }

  &.c1 {
    background: linear-gradient(140deg, #1a4a8a, #2d6fd6);
    box-shadow: 0 8rpx 32rpx rgba(26, 74, 138, 0.35);
  }
  &.c2 {
    background: linear-gradient(140deg, #17794a, #22a965);
    box-shadow: 0 8rpx 32rpx rgba(23, 121, 74, 0.35);
  }
  &.c3 {
    background: linear-gradient(140deg, #b85c1a, #e8842a);
    box-shadow: 0 8rpx 32rpx rgba(184, 92, 26, 0.35);
  }
  &.c4 {
    background: linear-gradient(140deg, #6b3399, #9556cc);
    box-shadow: 0 8rpx 32rpx rgba(107, 51, 153, 0.35);
  }
}
</style>
