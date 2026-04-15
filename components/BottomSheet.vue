<template>
  <view v-if="show" class="overlay" @click.self="$emit('close')">
    <view class="sheet" @click.stop>
      <view class="sheet-handle" />
      <view class="sheet-title" v-if="title">{{ title }}</view>
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' }
})
defineEmits(['close'])
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  .sheet {
    background: #fff;
    border-radius: 40rpx 40rpx 0 0;
    width: 100%;
    max-height: 72vh;
    padding: 16rpx 40rpx 60rpx;
    overflow-y: auto;
    animation: slideUp 0.28s ease;

    .sheet-handle {
      width: 72rpx;
      height: 8rpx;
      background: #e0e0e0;
      border-radius: 4rpx;
      margin: 0 auto 24rpx;
    }

    .sheet-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 28rpx;
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
