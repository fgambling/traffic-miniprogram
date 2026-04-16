<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="header-title">📊 客流趋势</view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- Tab 切换 -->
      <view class="tab-switch">
        <button
          v-for="(t, i) in tabs"
          :key="i"
          :class="{ active: activeTab === i }"
          @click="activeTab = i"
        >{{ t }}</button>
      </view>

      <!-- 摘要行 -->
      <view class="summary-row">
        <view class="summary-item">
          <view class="si-val">328</view>
          <view class="si-label">总人数</view>
        </view>
        <view class="summary-item">
          <view class="si-val">47</view>
          <view class="si-label">日均</view>
        </view>
        <view class="summary-item">
          <view class="si-val">14:00</view>
          <view class="si-label">峰值时段</view>
        </view>
      </view>

      <!-- 图表 -->
      <view class="section-title">今日客流按时统计</view>
      <view class="chart-card">
        <UniChart
          canvas-id="chart-trend"
          type="bar"
          :data="chartData"
          :labels="chartLabels"
          :peak-threshold="50"
          :height="320"
        />
        <view class="chart-legend">
          <view class="legend-item">
            <view class="legend-dot" style="background: rgba(31,71,136,.55);" />
            <text>普通时段</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot" style="background: rgba(200,60,50,.65);" />
            <text>峰值时段（≥50人）</text>
          </view>
        </view>
      </view>

      <!-- 高级版锁定 -->
      <view class="section-title">
        同期对比
        <text class="section-badge">高级版</text>
      </view>
      <view class="lock-card" @click="showUpgradeSheet = true">
        <text class="lock-icon">📊</text>
        <text class="lock-text">升级高级版查看历史同期对比</text>
        <view class="lock-btn">立即升级</view>
      </view>
      <view class="tab-spacer" />
    </scroll-view>

    <TabBar role="merchant" :current="1" />

    <BottomSheet :show="showUpgradeSheet" title="升级套餐" @close="showUpgradeSheet = false">
      <text style="font-size: 26rpx; color: #666; line-height: 1.7; display: block; margin-bottom: 32rpx;">
        升级高级版即可查看历史同期对比、30天+趋势分析及报表导出功能。
      </text>
      <button class="btn-upgrade" @click="showUpgradeSheet = false">立即升级 ¥299/月</button>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import UniChart from '../../components/UniChart.vue'
import { statusBarHeight } from '../../utils/system.js'

const tabs = ['小时', '日', '周', '月']
const activeTab = ref(0)
const showUpgradeSheet = ref(false)

const chartData = [12, 25, 38, 45, 52, 35, 58, 42, 30, 22, 18, 15, 8]
const chartLabels = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.page-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 20rpx 32rpx 36rpx;
  flex-shrink: 0;

  .header-title {
    font-size: 34rpx;
    font-weight: 600;
  }
}

.scroll-area {
  flex: 1;
  background: #f0f2f7;
}

/* Summary row */
.summary-row {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 8rpx;

  .summary-item {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 20rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    .si-val {
      font-size: 40rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .si-label {
      font-size: 20rpx;
      color: #999;
      margin-top: 4rpx;
    }
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;

  .section-badge {
    font-size: 20rpx;
    color: #999;
    font-weight: 400;
    background: #f0f0f0;
    padding: 4rpx 12rpx;
    border-radius: 10rpx;
  }
}

.chart-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 28rpx 28rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .chart-legend {
    display: flex;
    gap: 32rpx;
    margin-top: 16rpx;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 20rpx;
      color: #999;
    }

    .legend-dot {
      width: 20rpx;
      height: 20rpx;
      border-radius: 4rpx;
    }
  }
}

.lock-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;

  .lock-icon { font-size: 72rpx; opacity: 0.3; }
  .lock-text { font-size: 26rpx; color: #999; }

  .lock-btn {
    margin-top: 8rpx;
    padding: 16rpx 40rpx;
    background: linear-gradient(135deg, #07c160, #06ad56);
    color: #fff;
    border-radius: 20rpx;
    font-size: 26rpx;
    font-weight: 600;
  }
}

.btn-upgrade {
  width: 100%;
  height: 96rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #07c160, #06ad56);
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  line-height: 1;
}
</style>
