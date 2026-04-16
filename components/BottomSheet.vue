<template>
  <view v-if="show" class="overlay" @click.self="$emit('close')">
    <view class="sheet" @click.stop>
      <view class="sheet-handle" />
      <view class="sheet-header" v-if="title">
        <text class="sheet-title">{{ title }}</text>
        <view class="close-btn" @click="$emit('close')">✕</view>
      </view>
      <scroll-view class="sheet-body" scroll-y>
        <slot />
      </scroll-view>
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  backdrop-filter: blur(2px);

  .sheet {
    background: #fff;
    border-radius: 48rpx 48rpx 0 0;
    width: 100%;
    max-height: 76vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.34, 1.12, 0.64, 1);

    .sheet-handle {
      width: 72rpx;
      height: 8rpx;
      background: #e8e8ec;
      border-radius: 4rpx;
      margin: 16rpx auto 0;
      flex-shrink: 0;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 40rpx 0;
      flex-shrink: 0;

      .sheet-title {
        font-size: 32rpx;
        font-weight: 700;
        color: #1a1a2e;
      }

      .close-btn {
        width: 56rpx;
        height: 56rpx;
        background: #f0f0f5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        color: #999;

        &:active { opacity: 0.7; }
      }
    }

    .sheet-body {
      flex: 1;
      padding: 24rpx 40rpx 60rpx;
      overflow-y: auto;
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
