<template>
  <view class="page">
    <view class="page-header">
      <view class="header-title">💡 AI经营建议</view>
      <view class="header-sub">基于客流画像 + 商家数据智能生成</view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- Tab 筛选 -->
      <view class="tab-switch">
        <button
          v-for="(t, i) in filterTabs"
          :key="i"
          :class="{ active: activeFilter === i }"
          @click="activeFilter = i"
        >{{ t }}</button>
      </view>

      <!-- 建议卡片 -->
      <view
        v-for="advice in filteredAdvices"
        :key="advice.id"
        class="advice-card"
        :style="{ borderLeftColor: advice.color }"
        @click="openDetail(advice)"
      >
        <view class="ac-tag" :style="{ background: advice.tagBg, color: advice.color }">
          {{ advice.typeIcon }} {{ advice.type }}
        </view>
        <view class="ac-title">{{ advice.title }}</view>
        <view class="ac-desc">{{ advice.desc }}</view>
        <view class="ac-time">🕐 {{ advice.time }}</view>
      </view>

      <view style="height: 160rpx;" />
    </scroll-view>

    <!-- FAB 生成按钮 -->
    <view class="fab" @click="showGenSheet = true">⚡</view>

    <TabBar role="merchant" :current="3" />

    <!-- 建议详情弹层 -->
    <BottomSheet :show="showDetailSheet" :title="currentAdvice?.title" @close="showDetailSheet = false">
      <view v-if="currentAdvice" class="detail-body">
        <view class="detail-content">{{ currentAdvice.detail }}</view>
        <view class="detail-basis">
          <view class="db-label">📊 数据依据</view>
          <view class="db-text">{{ currentAdvice.basis }}</view>
        </view>
        <view class="feedback-row">
          <button
            class="fb-btn"
            :class="{ done: currentAdvice.feedback === 1 }"
            @click="sendFeedback(currentAdvice, 1)"
          >
            {{ currentAdvice.feedback === 1 ? '✅ 已反馈' : '👍 有用' }}
          </button>
          <button
            class="fb-btn fb-neg"
            :class="{ done: currentAdvice.feedback === 2 }"
            @click="sendFeedback(currentAdvice, 2)"
          >
            {{ currentAdvice.feedback === 2 ? '✅ 已反馈' : '👎 无用' }}
          </button>
        </view>
      </view>
    </BottomSheet>

    <!-- 生成弹层 -->
    <BottomSheet :show="showGenSheet" title="生成AI建议" @close="showGenSheet = false">
      <view class="gen-body">
        <text class="gen-desc">系统将结合最新客流数据及您当前录入的菜单、促销信息，为您生成一个性化经营建议。</text>
        <view class="gen-quota">⚡ 今日剩余次数：2/3</view>
        <button class="btn-gen" @click="generateAdvice">立即生成</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'

const filterTabs = ['全部', '备货', '排班', '营销']
const activeFilter = ref(0)
const showDetailSheet = ref(false)
const showGenSheet = ref(false)
const currentAdvice = ref(null)

const advices = ref([
  {
    id: 1, type: '备货', typeIcon: '📦', category: 1,
    color: '#1a4a8a', tagBg: '#e4edfa',
    title: '建议增加下午茶时段小饮备货量',
    desc: '根据近7天数据，14:00-16:00时段客流集中（占全天32%），且以18-35岁女性为主（61%），建议将饮品类产品备货量提升30%。',
    time: '今天 10:30 · 基于近7天客流数据',
    detail: '根据近7天客流数据分析：\n· 14:00-16:00时段日均客流105人，占全天32%\n· 该时段女性占比61%，18-35岁占74%\n· 短袖穿着占68%，气温偏高\n\n建议将饮品类产品日均备货量从当前50杯提升至65杯（+30%），避免下午断货。',
    basis: '客流时段分析 · 性别年龄画像 · 穿着季节特征 · 菜单销售数据',
    feedback: 0
  },
  {
    id: 2, type: '排班', typeIcon: '👥', category: 2,
    color: '#17794a', tagBg: '#e8f5e9',
    title: '周末下午建议增加1名临时员工',
    desc: '周末14:00-17:00客流较工作日高出45%，平均停留时长上升3分钟，可能存在等候排队问题。',
    time: '昨天 09:00 · 基于近30天周末数据',
    detail: '周末高峰期排班建议：\n· 周末14:00-17:00时段客流比工作日高45%\n· 高峰期等候时间估计增加约4-6分钟\n· 建议增加1名临时员工，专注于收银或备料\n\n预计额外人力成本约¥120-180/天，可有效提升顾客体验。',
    basis: '工作日/周末客流对比 · 平均停留时长分析',
    feedback: 0
  },
  {
    id: 3, type: '营销', typeIcon: '📢', category: 3,
    color: '#e8842a', tagBg: '#fff3e0',
    title: '工作日早间推出早餐早饮套餐',
    desc: '工作日8:00-9:30有稳定客流（日均28人），82%为18-40岁，多戴眼镜和背包，符合上班族特征。',
    time: '2天前 · 基于工作日客流画像',
    detail: '早餐套餐营销方案：\n· 工作日8:00-9:30稳定客流日均28人\n· 82%为18-40岁上班族特征客群\n· 建议推出"早餐+饮品"套餐，定价18-25元\n\n结合微信公众号推送，可提升该时段转化率约20%。',
    basis: '工作日客流画像 · 时段分布分析',
    feedback: 0
  },
  {
    id: 4, type: '营销', typeIcon: '💰', category: 3,
    color: '#6b3399', tagBg: '#f3e5f5',
    title: '推荐对龙凤茶考虑微调价格2元',
    desc: '该产品的特价的高而毛利润率低于均值，结合当前客群消费能力和竞品价格，建议调整至30元。',
    time: '3天前 · 基于销售数据+客流画像',
    detail: '价格优化建议：\n· 龙凤茶当前售价28元，毛利率约35%，低于门店均值42%\n· 周边3家竞品同类产品售价29-32元\n· 当前客群消费能力匹配度高（上班族占62%）\n\n建议将价格调整至30元，预计毛利率提升至40%，影响销量约-5%。',
    basis: '菜单销售数据 · 客流画像 · 竞品价格分析',
    feedback: 0
  }
])

const filteredAdvices = computed(() => {
  if (activeFilter.value === 0) return advices.value
  return advices.value.filter(a => a.category === activeFilter.value)
})

function openDetail(advice) {
  currentAdvice.value = advice
  showDetailSheet.value = true
}

function sendFeedback(advice, type) {
  if (advice.feedback) return
  advice.feedback = type
  uni.showToast({ title: '感谢反馈', icon: 'success' })
}

function generateAdvice() {
  showGenSheet.value = false
  uni.showToast({ title: '正在生成，请稍候...', icon: 'loading', duration: 2000 })
}
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
  padding: 80rpx 32rpx 36rpx;
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

/* 建议卡片 */
.advice-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 0 32rpx 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  border-left: 8rpx solid transparent;

  &:active { opacity: 0.85; }

  .ac-tag {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    padding: 6rpx 20rpx;
    border-radius: 20rpx;
    font-size: 20rpx;
    font-weight: 600;
    margin-bottom: 12rpx;
  }

  .ac-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 8rpx;
    line-height: 1.4;
  }

  .ac-desc {
    font-size: 24rpx;
    color: #888;
    line-height: 1.6;
  }

  .ac-time {
    font-size: 20rpx;
    color: #bbb;
    margin-top: 16rpx;
  }
}

/* FAB */
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
  font-size: 44rpx;
  box-shadow: 0 8rpx 36rpx rgba(31, 71, 136, 0.4);
  z-index: 50;

  &:active { opacity: 0.85; }
}

/* 详情弹层 */
.detail-body {
  .detail-content {
    font-size: 26rpx;
    color: #333;
    line-height: 1.8;
    margin-bottom: 24rpx;
    white-space: pre-line;
  }

  .detail-basis {
    background: #f6f7fa;
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 28rpx;

    .db-label {
      font-size: 22rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .db-text {
      font-size: 24rpx;
      color: #666;
      line-height: 1.6;
    }
  }

  .feedback-row {
    display: flex;
    gap: 20rpx;

    .fb-btn {
      flex: 1;
      height: 80rpx;
      border-radius: 20rpx;
      background: #f4f5f9;
      color: #333;
      font-size: 26rpx;
      border: 1rpx solid #e0e0e0;
      line-height: 1;

      &.done {
        opacity: 0.5;
      }

      &.fb-neg {
        // same style
      }
    }
  }
}

/* 生成弹层 */
.gen-body {
  .gen-desc {
    font-size: 26rpx;
    color: #666;
    line-height: 1.7;
    display: block;
    margin-bottom: 24rpx;
  }

  .gen-quota {
    background: #fffde7;
    border-radius: 20rpx;
    padding: 24rpx;
    font-size: 24rpx;
    color: #f57f17;
    margin-bottom: 32rpx;
  }

  .btn-gen {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    line-height: 1;
  }
}
</style>
