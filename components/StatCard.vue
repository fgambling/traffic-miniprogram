<template>
  <view class="stat-card" :class="`c${color}`" @click="$emit('click')">
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

  .label {
    font-size: 22rpx;
    opacity: 0.85;
  }

  .val {
    font-size: 56rpx;
    font-weight: 700;
    margin: 12rpx 0 4rpx;
    letter-spacing: -1rpx;
    line-height: 1.1;
  }

  .delta {
    font-size: 22rpx;
    opacity: 0.75;
  }

  &.c1 { background: linear-gradient(135deg, #1a4a8a, #2d6fd6); }
  &.c2 { background: linear-gradient(135deg, #17794a, #22a965); }
  &.c3 { background: linear-gradient(135deg, #b85c1a, #e8842a); }
  &.c4 { background: linear-gradient(135deg, #6b3399, #9556cc); }
}
</style>
