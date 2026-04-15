<template>
  <view class="page">
    <!-- Header -->
    <view class="mode-header">
      <view class="header-left">
        <text class="header-title">👤 {{ userInfo?.nickname || '业务员' }}的工作台</text>
      </view>
      <view class="period-switch">
        <view
          class="ps-btn"
          :class="{ active: period === 'month' }"
          @click="period = 'month'"
        >本月</view>
        <view
          class="ps-btn"
          :class="{ active: period === 'all' }"
          @click="period = 'all'"
        >全部</view>
      </view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- 4色统计卡片 -->
      <view class="stat-grid">
        <StatCard label="本月签约" value="5" delta="本月第2" :color="1" />
        <StatCard label="累计佣金" value="¥8,350" delta="可提现 ¥3,200" :color="2" @click="goCommission" />
        <StatCard label="跟进中" value="12" delta="3家待拜访" :color="3" @click="goFollow" />
        <StatCard label="已合作" value="18" delta="入职以来" :color="4" />
      </view>

      <!-- 待办事项 -->
      <view class="section-title">待办事项</view>

      <FollowCard
        name="荣创科技 需要回访"
        sub="上次跟进：3天前"
        avatar-bg="#fff3e0"
        avatar-color="#e65100"
        avatar-text="⚠️"
        status="待跟进"
        status-bg="#fff3e0"
        status-color="#e65100"
        @click="goFollow"
      />

      <FollowCard
        name="芳香咖啡 等待签约"
        sub="已洽谈2周"
        avatar-bg="#e4edfa"
        avatar-color="#1f4788"
        avatar-text="📝"
        status="洽谈中"
        status-bg="#e4edfa"
        status-color="#1a4a8a"
        @click="goFollow"
      />

      <FollowCard
        name="设备安装 · 预约明天"
        sub="明天 14:00 上门安装"
        avatar-bg="#e8f5e9"
        avatar-color="#17794a"
        avatar-text="🚚"
        status="已排期"
        status-bg="#e8f5e9"
        status-color="#17794a"
      />

      <view style="height: 160rpx;" />
    </scroll-view>

    <!-- FAB -->
    <view class="fab" @click="goFollow">➕</view>

    <TabBar role="salesman" :current="0" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '../../components/TabBar.vue'
import StatCard from '../../components/StatCard.vue'
import FollowCard from '../../components/FollowCard.vue'
import { useUserStore } from '../../store/user.js'

const { state } = useUserStore()
const userInfo = state.userInfo
const period = ref('month')

function goFollow() { uni.redirectTo({ url: '/pages/salesman/follow' }) }
function goCommission() { uni.redirectTo({ url: '/pages/salesman/commission' }) }
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.mode-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 80rpx 32rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
  }

  .period-switch {
    display: flex;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 16rpx;
    padding: 4rpx;

    .ps-btn {
      padding: 10rpx 24rpx;
      border-radius: 12rpx;
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.5);
      transition: all 0.2s;

      &.active {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        font-weight: 600;
      }
    }
  }
}

.scroll-area {
  flex: 1;
  background: #f4f5f9;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  padding: 32rpx 32rpx 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 8rpx 36rpx rgba(31, 71, 136, 0.4);
  z-index: 50;

  &:active { opacity: 0.85; }
}
</style>
