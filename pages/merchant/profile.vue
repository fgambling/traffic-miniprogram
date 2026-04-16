<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="header-title">👤 用户画像</view>
      <view class="header-sub">今日 · 328位顾客</view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- 客群标签 -->
      <view class="section-title">客群标签</view>
      <view class="tag-grid">
        <view v-for="tag in tags" :key="tag.label" class="tag-pill" :style="{ background: tag.bg, color: tag.color }">
          {{ tag.label }} {{ tag.pct }}%
        </view>
      </view>

      <!-- 穿着风格 -->
      <view class="section-title">穿着风格</view>
      <view class="bars-section">
        <AttrBar
          v-for="item in styleData"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :color="item.color"
        />
      </view>

      <!-- 配饰统计 -->
      <view class="section-title">配饰统计</view>
      <view class="bars-section">
        <AttrBar
          v-for="item in accessoryData"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :color="item.color"
        />
      </view>

      <!-- 下装类型 -->
      <view class="section-title">下装类型</view>
      <view class="bars-section">
        <AttrBar
          v-for="item in bottomData"
          :key="item.label"
          :label="item.label"
          :value="item.value"
          :color="item.color"
        />
      </view>
      <view class="tab-spacer" />
    </scroll-view>

    <TabBar role="merchant" :current="2" />
  </view>
</template>

<script setup>
import TabBar from '../../components/TabBar.vue'
import AttrBar from '../../components/AttrBar.vue'
import { statusBarHeight } from '../../utils/system.js'

const tags = [
  { label: '上班族', pct: 62, bg: '#e4edfa', color: '#1a4a8a' },
  { label: '回头客', pct: 38, bg: '#e8f5e9', color: '#17794a' },
  { label: '新客',   pct: 45, bg: '#fce4ec', color: '#c62828' },
  { label: '异性同行', pct: 22, bg: '#fff3e0', color: '#e65100' },
  { label: '常客',   pct: 15, bg: '#f3e5f5', color: '#6a1b9a' },
  { label: '亲子',   pct: 8,  bg: '#e0f7fa', color: '#00695c' }
]

const styleData = [
  { label: '短袖', value: 52, color: 'linear-gradient(90deg, #1a4a8a, #3a7ad6)' },
  { label: '长袖', value: 35, color: 'linear-gradient(90deg, #17794a, #22a965)' },
  { label: '长外套', value: 13, color: 'linear-gradient(90deg, #b85c1a, #e8842a)' }
]

const accessoryData = [
  { label: '背包',  value: 45, color: '#6b3399' },
  { label: '眼镜',  value: 32, color: '#1a4a8a' },
  { label: '手提包', value: 28, color: '#c62828' },
  { label: '帽子',  value: 15, color: '#e8842a' },
  { label: '单肩包', value: 18, color: '#00838f' }
]

const bottomData = [
  { label: '长裤',   value: 68, color: '#37474f' },
  { label: '短裤',   value: 18, color: '#00838f' },
  { label: '裙子/连衣裙', value: 14, color: '#d64a7a' }
]
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

  .header-sub {
    font-size: 24rpx;
    opacity: 0.7;
    margin-top: 6rpx;
  }
}

.scroll-area {
  flex: 1;
  background: #f4f5f9;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 8rpx;

  .tag-pill {
    padding: 12rpx 28rpx;
    border-radius: 40rpx;
    font-size: 24rpx;
    font-weight: 500;
  }
}

.bars-section {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}
</style>
