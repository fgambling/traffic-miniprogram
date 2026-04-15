<template>
  <view class="page">
    <!-- ===== Header ===== -->
    <view class="hero-header">
      <view class="top-bar">
        <view class="store-name">
          <text class="store-icon">🏪</text>
          <text>{{ storeName }}</text>
        </view>
        <view class="top-right">
          <text class="date-text">{{ dateText }}</text>
          <view class="icon-btn" @click="showStoreSheet = true">🔀</view>
        </view>
      </view>

      <!-- 核心数字 -->
      <view class="hero-number">
        <view class="hero-label">今日进店客流</view>
        <view class="hero-val">{{ stat.todayCount }}</view>
        <view class="hero-delta">
          <text>📈</text>
          <text>较昨日 +{{ stat.deltaPercent }}%</text>
        </view>
      </view>

      <!-- 3 格小指标 -->
      <view class="sub-metrics">
        <view class="sub-metric">
          <view class="sm-val">{{ stat.currentInStore }}</view>
          <view class="sm-label">当前在店</view>
        </view>
        <view class="sub-metric border-x">
          <view class="sm-val">{{ stat.entryRate }}<text class="sm-unit">%</text></view>
          <view class="sm-label">进店率</view>
        </view>
        <view class="sub-metric">
          <view class="sm-val">{{ stat.avgStay }}<text class="sm-unit">min</text></view>
          <view class="sm-label">平均停留</view>
        </view>
      </view>
    </view>

    <!-- ===== 滚动内容 ===== -->
    <scroll-view class="scroll-area" scroll-y>
      <!-- 性别 + 年龄 -->
      <view class="row-2 pad">
        <!-- 性别 -->
        <view class="mini-card">
          <view class="mini-title">👥 性别分布</view>
          <view class="gender-bar">
            <view class="male" :style="`width: ${stat.malePercent}%`" />
            <view class="female" :style="`width: ${100 - stat.malePercent}%`" />
          </view>
          <view class="gender-legend">
            <view class="legend-item">
              <view class="dot dot-blue" />
              <text>男 {{ stat.malePercent }}%</text>
            </view>
            <view class="legend-item">
              <view class="dot dot-pink" />
              <text>女 {{ 100 - stat.malePercent }}%</text>
            </view>
          </view>
        </view>

        <!-- 年龄 -->
        <view class="mini-card">
          <view class="mini-title">🕐 年龄段</view>
          <view class="age-bars">
            <view v-for="ag in ageData" :key="ag.label" class="age-col">
              <text class="age-pct" :style="{ color: ag.color }">{{ ag.pct }}%</text>
              <view class="age-fill" :style="{ height: ag.barH + 'rpx', background: ag.color }" />
              <text class="age-label">{{ ag.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 客流趋势折线图 -->
      <view class="card mx-pad">
        <view class="card-header">
          <text class="card-title">📈 今日客流趋势</text>
          <text class="card-more" @click="goTrend">详情 ›</text>
        </view>
        <UniChart
          canvas-id="chart-dashboard"
          type="line"
          :data="hourlyData"
          :labels="hourlyLabels"
          :height="280"
        />
      </view>

      <!-- 快捷入口 -->
      <view class="card mx-pad quick-card">
        <view class="quick-grid">
          <view class="quick-item" @click="goTrend">
            <view class="qi-icon" style="background:#e4edfa;">📊</view>
            <text class="qi-label">客流趋势</text>
          </view>
          <view class="quick-item" @click="goProfile">
            <view class="qi-icon" style="background:#fce4ec;">👤</view>
            <text class="qi-label">用户画像</text>
          </view>
          <view class="quick-item" @click="goAI">
            <view class="qi-icon" style="background:#e8f5e9;">💡</view>
            <text class="qi-label">AI建议</text>
          </view>
          <view class="quick-item" @click="showUpgradeSheet = true">
            <view class="qi-icon" style="background:#fff3e0;">
              <text>📄</text>
              <view class="lock-badge">🔒</view>
            </view>
            <text class="qi-label">数据导出</text>
          </view>
        </view>
      </view>

      <view style="height: 140rpx;" />
    </scroll-view>

    <!-- Tab Bar -->
    <TabBar role="merchant" :current="0" />

    <!-- 切换门店弹层 -->
    <BottomSheet :show="showStoreSheet" title="切换门店" @close="showStoreSheet = false">
      <view v-for="s in stores" :key="s.id" class="store-item" @click="selectStore(s)">
        <view class="store-item-icon">🏪</view>
        <view class="store-item-info">
          <view class="sii-name">{{ s.name }}</view>
          <view class="sii-sub">{{ s.cameraInfo }}</view>
        </view>
        <view v-if="s.id === currentStoreId" class="current-badge">当前</view>
      </view>
    </BottomSheet>

    <!-- 升级套餐弹层 -->
    <BottomSheet :show="showUpgradeSheet" title="升级套餐" @close="showUpgradeSheet = false">
      <view class="upgrade-body">
        <text class="upgrade-desc">数据导出功能需要高级套餐。升级后可享受全AI经营建议、30天+历史对比、报表导出等功能。</text>
        <button class="btn-upgrade" @click="showUpgradeSheet = false">立即升级到高级版 ¥299/月</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import UniChart from '../../components/UniChart.vue'

// ---- Mock 数据 ----
const stat = ref({
  todayCount: 328,
  deltaPercent: 12.3,
  currentInStore: 23,
  entryRate: 34,
  avgStay: 18,
  malePercent: 58
})

const hourlyData = [12, 25, 38, 45, 52, 35, 58, 42, 30, 22, 18, 15, 8]
const hourlyLabels = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']

const ageData = [
  { label: '<18', pct: 8,  color: '#e8842a', barH: 16 },
  { label: '18-60', pct: 78, color: '#2d6fd6', barH: 64 },
  { label: '>60', pct: 14, color: '#9556cc', barH: 32 }
]

const storeName = ref('撸享茶饮（上达店）')
const currentStoreId = ref('S001')
const stores = [
  { id: 'S001', name: '撸享茶饮（上达店）', cameraInfo: '设备在线 · cam-0' },
  { id: 'S002', name: '撸享茶饮（铂泰店）', cameraInfo: '设备在线 · cam-0, cam-1' }
]

const showStoreSheet = ref(false)
const showUpgradeSheet = ref(false)

// 日期
const now = new Date()
const dateText = `${now.getMonth() + 1}月${now.getDate()}日 周${['日','一','二','三','四','五','六'][now.getDay()]}`

function selectStore(s) {
  currentStoreId.value = s.id
  storeName.value = s.name
  showStoreSheet.value = false
}

function goTrend() { uni.redirectTo({ url: '/pages/merchant/trend' }) }
function goProfile() { uni.redirectTo({ url: '/pages/merchant/profile' }) }
function goAI() { uni.redirectTo({ url: '/pages/merchant/ai-advice' }) }
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ===== Hero Header ===== */
.hero-header {
  background: linear-gradient(135deg, #162d50, #1f4788);
  color: #fff;
  padding: 80rpx 40rpx 32rpx;
  flex-shrink: 0;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 36rpx;

    .store-name {
      display: flex;
      align-items: center;
      gap: 12rpx;
      font-size: 28rpx;
      font-weight: 500;
      opacity: 0.9;

      .store-icon { font-size: 32rpx; }
    }

    .top-right {
      display: flex;
      align-items: center;
      gap: 24rpx;

      .date-text {
        font-size: 22rpx;
        opacity: 0.5;
      }

      .icon-btn {
        font-size: 36rpx;
        opacity: 0.8;
      }
    }
  }

  .hero-number {
    text-align: center;
    padding: 8rpx 0 16rpx;

    .hero-label {
      font-size: 22rpx;
      opacity: 0.6;
      letter-spacing: 2rpx;
    }

    .hero-val {
      font-size: 112rpx;
      font-weight: 700;
      letter-spacing: -4rpx;
      line-height: 1.1;
      margin: 12rpx 0 8rpx;
    }

    .hero-delta {
      display: inline-flex;
      align-items: center;
      gap: 8rpx;
      background: rgba(255, 255, 255, 0.12);
      padding: 6rpx 24rpx;
      border-radius: 40rpx;
      font-size: 22rpx;
    }
  }

  .sub-metrics {
    display: flex;
    margin-top: 32rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 24rpx;
    padding: 24rpx 0;

    .sub-metric {
      flex: 1;
      text-align: center;

      .sm-val {
        font-size: 44rpx;
        font-weight: 700;
        .sm-unit { font-size: 24rpx; font-weight: 500; }
      }

      .sm-label {
        font-size: 20rpx;
        opacity: 0.55;
        margin-top: 4rpx;
      }

      &.border-x {
        border-left: 1rpx solid rgba(255, 255, 255, 0.1);
        border-right: 1rpx solid rgba(255, 255, 255, 0.1);
      }
    }
  }
}

/* ===== Scroll area ===== */
.scroll-area {
  flex: 1;
  background: #f0f2f7;
}

.pad { padding: 32rpx 32rpx 0; }
.mx-pad { margin: 24rpx 32rpx 0; }

.row-2 {
  display: flex;
  gap: 20rpx;
}

/* ===== Mini cards ===== */
.mini-card {
  flex: 1;
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

  .mini-title {
    font-size: 24rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }

  /* 性别条 */
  .gender-bar {
    height: 16rpx;
    border-radius: 8rpx;
    overflow: hidden;
    display: flex;
    margin-bottom: 12rpx;

    .male { background: linear-gradient(90deg, #1a4a8a, #3a7ad6); }
    .female { background: linear-gradient(90deg, #d64a7a, #e8729a); }
  }

  .gender-legend {
    display: flex;
    justify-content: space-between;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6rpx;
      font-size: 20rpx;
      color: #999;
    }

    .dot {
      width: 12rpx;
      height: 12rpx;
      border-radius: 6rpx;

      &.dot-blue { background: #2a5298; }
      &.dot-pink { background: #d64a7a; }
    }
  }

  /* 年龄柱 */
  .age-bars {
    display: flex;
    gap: 12rpx;
    align-items: flex-end;
    height: 80rpx;

    .age-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4rpx;

      .age-pct {
        font-size: 20rpx;
        font-weight: 600;
      }

      .age-fill {
        width: 100%;
        border-radius: 6rpx 6rpx 0 0;
      }

      .age-label {
        font-size: 18rpx;
        color: #bbb;
      }
    }
  }
}

/* ===== Card ===== */
.card {
  background: #fff;
  border-radius: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 28rpx 12rpx;

    .card-title {
      font-size: 26rpx;
      font-weight: 600;
      color: #333;
    }

    .card-more {
      font-size: 24rpx;
      color: #1f4788;
    }
  }
}

/* ===== Quick grid ===== */
.quick-card {
  padding: 16rpx;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);

  .quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    padding: 24rpx 8rpx;

    &:active { opacity: 0.7; }

    .qi-icon {
      width: 84rpx;
      height: 84rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
      position: relative;

      .lock-badge {
        position: absolute;
        top: -4rpx;
        right: -4rpx;
        font-size: 22rpx;
      }
    }

    .qi-label {
      font-size: 22rpx;
      color: #333;
    }
  }
}

/* ===== Store sheet items ===== */
.store-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child { border-bottom: none; }
  &:active { opacity: 0.75; }

  .store-item-icon { font-size: 40rpx; }

  .store-item-info {
    flex: 1;

    .sii-name { font-size: 28rpx; font-weight: 600; color: #1a1a2e; }
    .sii-sub { font-size: 22rpx; color: #999; margin-top: 4rpx; }
  }

  .current-badge {
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    background: #e8f5e9;
    color: #17794a;
    font-size: 22rpx;
    font-weight: 600;
  }
}

/* ===== Upgrade sheet ===== */
.upgrade-body {
  .upgrade-desc {
    font-size: 26rpx;
    color: #666;
    line-height: 1.7;
    display: block;
    margin-bottom: 32rpx;
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
}
</style>
