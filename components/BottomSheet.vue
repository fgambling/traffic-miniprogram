<template>
  <view
    v-if="show"
    class="overlay"
    @touchmove.stop.prevent="noop"
  >
    <view class="backdrop" @click="$emit('close')" @touchmove.stop.prevent="noop" />
    <view class="sheet" :style="sheetStyle" @click.stop @touchmove.stop>
      <view class="sheet-handle" />
      <view class="sheet-header" v-if="title">
        <text class="sheet-title">{{ title }}</text>
        <view class="close-btn" @click="$emit('close')">✕</view>
      </view>
      <scroll-view class="sheet-body" scroll-y>
        <view class="sheet-body-inner">
          <slot />
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: '' },
  height: { type: String, default: '76vh' }
})
defineEmits(['close'])
const noop = () => {}
const sheetStyle = computed(() => ({
  height: props.height,
  maxHeight: props.height
}))
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  .backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .sheet {
    position: relative;
    background: #fff;
    border-radius: 48rpx 48rpx 0 0;
    width: 100%;
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
      height: 0;
      min-height: 0;          /* flex 子元素必须设置，否则高度被内容撑满后无法滚动 */
      width: 100%;
      box-sizing: border-box;
      overflow-y: auto;
      white-space: normal;

      .sheet-body-inner {
        padding: 24rpx 40rpx 60rpx;
        box-sizing: border-box;
        width: 100%;
        white-space: normal;
      }
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
