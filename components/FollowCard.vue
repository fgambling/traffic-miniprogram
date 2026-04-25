<template>
  <view class="follow-card" @click="$emit('click')">
    <view class="fc-info">
      <view class="fc-name-row">
        <text class="fc-name">{{ name }}</text>
      </view>
      <view class="fc-sub" v-if="sub">{{ sub }}</view>
      <view class="fc-addr" v-if="addr">📍 {{ addr }}</view>
    </view>
    <view class="fc-right">
      <view class="fc-badges">
        <view v-if="joint" class="fc-joint">联合跟进</view>
        <view
          v-if="status"
          class="fc-status"
          :style="{ background: statusBg, color: statusColor }"
        >{{ status }}</view>
      </view>
      <view
        v-if="amount"
        class="fc-amount"
        :style="{ color: amountColor }"
      >{{ amount }}</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  name: { type: String, default: '' },
  sub: { type: String, default: '' },
  addr: { type: String, default: '' },
  status: { type: String, default: '' },
  statusBg: { type: String, default: '#f0f0f0' },
  statusColor: { type: String, default: '#999' },
  amount: { type: String, default: '' },
  amountColor: { type: String, default: '#17794a' },
  joint: { type: Boolean, default: false }
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

  .fc-info {
    flex: 1;
    min-width: 0;

    .fc-name-row {
      display: flex;
      align-items: center;
    }

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

    .fc-addr {
      font-size: 21rpx;
      color: #bbb;
      margin-top: 4rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .fc-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8rpx;
    flex-shrink: 0;

    .fc-badges {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }

    .fc-joint {
      font-size: 18rpx;
      font-weight: 600;
      color: #6a1b9a;
      background: #f3e5f5;
      padding: 3rpx 12rpx;
      border-radius: 10rpx;
      white-space: nowrap;
    }

    .fc-status {
      padding: 6rpx 20rpx;
      border-radius: 20rpx;
      font-size: 20rpx;
      font-weight: 600;
    }

    .fc-amount {
      font-size: 28rpx;
      font-weight: 700;
    }
  }
}
</style>
