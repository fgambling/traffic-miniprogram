<template>
  <view class="page">
    <view class="page-header">
      <view class="header-title">💰 佣金明细</view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- 可提现卡片 -->
      <view class="balance-card">
        <view class="bc-label">可提现余额</view>
        <view class="bc-amount">¥3,200</view>
        <button class="bc-btn" @click="showWithdrawSheet = true">立即提现</button>
      </view>

      <!-- 摘要行 -->
      <view class="summary-row">
        <view class="summary-item">
          <view class="si-val">¥8,350</view>
          <view class="si-label">累计佣金</view>
        </view>
        <view class="summary-item">
          <view class="si-val">¥5,150</view>
          <view class="si-label">已提现</view>
        </view>
      </view>

      <!-- 记录列表 -->
      <view class="section-title">最近记录</view>

      <FollowCard
        v-for="record in records"
        :key="record.id"
        :name="record.name"
        :sub="record.sub"
        :avatar-bg="record.avatarBg"
        :avatar-color="record.avatarColor"
        :avatar-text="record.icon"
        :amount="record.amount"
        :amount-color="record.amountColor"
      />

      <view style="height: 140rpx;" />
    </scroll-view>

    <TabBar role="salesman" :current="2" />

    <!-- 提现弹层 -->
    <BottomSheet :show="showWithdrawSheet" title="申请提现" @close="showWithdrawSheet = false">
      <view class="withdraw-form">
        <view class="form-item">
          <text class="form-label">提现方式</text>
          <view class="method-picker">
            <view
              class="mp-item"
              :class="{ active: withdrawMethod === 'wechat' }"
              @click="withdrawMethod = 'wechat'"
            >💬 微信</view>
            <view
              class="mp-item"
              :class="{ active: withdrawMethod === 'bank' }"
              @click="withdrawMethod = 'bank'"
            >🏦 银行卡</view>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">提现金额</text>
          <view class="amount-input-wrap">
            <text class="currency">¥</text>
            <input
              v-model="withdrawAmount"
              class="amount-input"
              placeholder="0.00"
              type="digit"
            />
          </view>
          <text class="amount-hint">可提现余额：¥3,200</text>
        </view>
        <button class="btn-withdraw" @click="submitWithdraw">确认提现</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import TabBar from '../../components/TabBar.vue'
import FollowCard from '../../components/FollowCard.vue'
import BottomSheet from '../../components/BottomSheet.vue'

const showWithdrawSheet = ref(false)
const withdrawMethod = ref('wechat')
const withdrawAmount = ref('')

const records = [
  {
    id: 1, name: '鲜花花艺坊 · 签约佣金', sub: '2026-04-10',
    icon: '💰', avatarBg: '#e8f5e9', avatarColor: '#17794a',
    amount: '+¥500', amountColor: '#17794a'
  },
  {
    id: 2, name: '轻食主义 · 月度续费佣金', sub: '2026-04-01',
    icon: '💰', avatarBg: '#e8f5e9', avatarColor: '#17794a',
    amount: '+¥200', amountColor: '#17794a'
  },
  {
    id: 3, name: '提现到微信', sub: '2026-03-28 · 已打款',
    icon: '📤', avatarBg: '#fce4ec', avatarColor: '#c62828',
    amount: '-¥2,000', amountColor: '#c62828'
  },
  {
    id: 4, name: '撸享茶饮上达店 · 签约佣金', sub: '2026-03-25',
    icon: '💰', avatarBg: '#e8f5e9', avatarColor: '#17794a',
    amount: '+¥500', amountColor: '#17794a'
  }
]

function submitWithdraw() {
  const amount = parseFloat(withdrawAmount.value)
  if (!amount || amount <= 0) {
    uni.showToast({ title: '请输入正确金额', icon: 'none' })
    return
  }
  if (amount > 3200) {
    uni.showToast({ title: '超出可提现余额', icon: 'none' })
    return
  }
  uni.showToast({ title: '提现申请已提交', icon: 'success' })
  showWithdrawSheet.value = false
  withdrawAmount.value = ''
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
}

.scroll-area {
  flex: 1;
  background: #f4f5f9;
}

/* 余额卡片 */
.balance-card {
  background: #fff;
  border-radius: 28rpx;
  margin: 32rpx 32rpx 0;
  padding: 40rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  text-align: center;

  .bc-label {
    font-size: 24rpx;
    color: #999;
    margin-bottom: 12rpx;
  }

  .bc-amount {
    font-size: 72rpx;
    font-weight: 700;
    color: #17794a;
    letter-spacing: -2rpx;
    margin-bottom: 28rpx;
  }

  .bc-btn {
    width: 300rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background: linear-gradient(135deg, #17794a, #22a965);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    line-height: 1;
  }
}

/* 摘要行 */
.summary-row {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
  margin: 24rpx 0 0;

  .summary-item {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 24rpx;
    text-align: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

    .si-val {
      font-size: 36rpx;
      font-weight: 700;
      color: #1a1a2e;
    }

    .si-label {
      font-size: 22rpx;
      color: #999;
      margin-top: 6rpx;
    }
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
  padding: 32rpx 32rpx 16rpx;
}

/* 提现表单 */
.withdraw-form {
  .form-item {
    margin-bottom: 32rpx;

    .form-label {
      font-size: 26rpx;
      color: #666;
      display: block;
      margin-bottom: 16rpx;
    }

    .method-picker {
      display: flex;
      gap: 20rpx;

      .mp-item {
        flex: 1;
        height: 80rpx;
        border-radius: 20rpx;
        background: #f4f5f9;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26rpx;
        font-weight: 500;
        border: 2rpx solid transparent;
        transition: all 0.2s;

        &.active {
          background: #e4edfa;
          color: #1f4788;
          border-color: #1f4788;
          font-weight: 600;
        }
      }
    }

    .amount-input-wrap {
      display: flex;
      align-items: center;
      background: #f4f5f9;
      border-radius: 20rpx;
      padding: 0 28rpx;
      height: 96rpx;

      .currency {
        font-size: 36rpx;
        color: #333;
        font-weight: 600;
        margin-right: 8rpx;
      }

      .amount-input {
        flex: 1;
        font-size: 40rpx;
        font-weight: 700;
        color: #333;
        border: none;
        background: transparent;
      }
    }

    .amount-hint {
      font-size: 22rpx;
      color: #aaa;
      margin-top: 10rpx;
      display: block;
    }
  }

  .btn-withdraw {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #17794a, #22a965);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    margin-top: 8rpx;
    line-height: 1;
  }
}
</style>
