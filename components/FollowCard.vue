<template>
  <view class="follow-card" @click="$emit('click')">
    <view class="fc-avatar" :style="{ background: avatarBg, color: avatarColor }">
      <slot name="icon">
        <text>{{ avatarText }}</text>
      </slot>
    </view>
    <view class="fc-info">
      <view class="fc-name">{{ name }}</view>
      <view class="fc-sub" v-if="sub">{{ sub }}</view>
    </view>
    <view
      v-if="status"
      class="fc-status"
      :style="{ background: statusBg, color: statusColor }"
    >{{ status }}</view>
    <view
      v-if="amount"
      class="fc-amount"
      :style="{ color: amountColor }"
    >{{ amount }}</view>
  </view>
</template>

<script setup>
defineProps({
  name: { type: String, default: '' },
  sub: { type: String, default: '' },
  avatarBg: { type: String, default: '#e4edfa' },
  avatarColor: { type: String, default: '#1f4788' },
  avatarText: { type: String, default: '' },
  status: { type: String, default: '' },
  statusBg: { type: String, default: '#f0f0f0' },
  statusColor: { type: String, default: '#999' },
  amount: { type: String, default: '' },
  amountColor: { type: String, default: '#17794a' }
})
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.follow-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx 16rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  gap: 24rpx;

  &:active {
    opacity: 0.85;
  }

  .fc-avatar {
    width: 84rpx;
    height: 84rpx;
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 36rpx;
    font-weight: 700;
  }

  .fc-info {
    flex: 1;
    min-width: 0;

    .fc-name {
      font-size: 26rpx;
      font-weight: 600;
      color: #1a1a2e;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fc-sub {
      font-size: 22rpx;
      color: #999;
      margin-top: 4rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .fc-status {
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    font-weight: 600;
    flex-shrink: 0;
  }

  .fc-amount {
    font-size: 28rpx;
    font-weight: 700;
    flex-shrink: 0;
  }
}
</style>
