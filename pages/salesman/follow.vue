<template>
  <view class="page">
    <view class="page-header">
      <view class="header-title">📋 商家跟进</view>
    </view>

    <scroll-view class="scroll-area" scroll-y>
      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          placeholder="搜索商家名称..."
          placeholder-style="color: #ccc;"
        />
      </view>

      <!-- Tab 过滤 -->
      <view class="tab-switch">
        <button
          v-for="(t, i) in filterTabs"
          :key="i"
          :class="{ active: activeFilter === i }"
          @click="activeFilter = i"
        >{{ t }}</button>
      </view>

      <!-- 跟进列表 -->
      <view v-for="item in filteredList" :key="item.id">
        <FollowCard
          :name="item.name"
          :sub="`${item.contact} · ${item.phone} · ${item.lastTime}`"
          :avatar-bg="item.avatarBg"
          :avatar-color="item.avatarColor"
          :avatar-text="item.icon"
          :status="item.status"
          :status-bg="item.statusBg"
          :status-color="item.statusColor"
          @click="openDetail(item)"
        />
      </view>

      <view style="height: 160rpx;" />
    </scroll-view>

    <!-- FAB 新增 -->
    <view class="fab" @click="showAddSheet = true">➕</view>

    <TabBar role="salesman" :current="1" />

    <!-- 新增跟进弹层 -->
    <BottomSheet :show="showAddSheet" title="新增跟进商家" @close="showAddSheet = false">
      <view class="form">
        <view class="form-item">
          <text class="form-label">商家名称 *</text>
          <input v-model="form.name" class="form-input" placeholder="请输入商家名称" />
        </view>
        <view class="form-item">
          <text class="form-label">联系人 *</text>
          <input v-model="form.contact" class="form-input" placeholder="请输入联系人姓名" />
        </view>
        <view class="form-item">
          <text class="form-label">联系电话 *</text>
          <input v-model="form.phone" class="form-input" placeholder="请输入手机号" type="number" />
        </view>
        <view class="form-item">
          <text class="form-label">营业执照号（选填）</text>
          <input v-model="form.license" class="form-input" placeholder="请输入营业执照号" />
        </view>
        <view class="form-item">
          <text class="form-label">跟进状态</text>
          <view class="status-picker">
            <view
              v-for="s in statusOptions"
              :key="s.value"
              class="sp-item"
              :class="{ active: form.status === s.value }"
              :style="form.status === s.value ? { background: s.bg, color: s.color } : {}"
              @click="form.status = s.value"
            >{{ s.label }}</view>
          </view>
        </view>
        <button class="btn-submit" @click="submitAdd">确认添加</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import TabBar from '../../components/TabBar.vue'
import FollowCard from '../../components/FollowCard.vue'
import BottomSheet from '../../components/BottomSheet.vue'

const keyword = ref('')
const activeFilter = ref(0)
const showAddSheet = ref(false)

const filterTabs = ['全部 (30)', '接洽中 (12)', '已合作 (18)']

const form = ref({ name: '', contact: '', phone: '', license: '', status: 'contact' })

const statusOptions = [
  { value: 'contact', label: '接洽中', bg: '#e4edfa', color: '#1a4a8a' },
  { value: 'done', label: '已合作', bg: '#e8f5e9', color: '#17794a' },
  { value: 'lost', label: '已流失', bg: '#f0f0f0', color: '#999' }
]

const followList = ref([
  {
    id: 1, name: '荣创科技', contact: '赵四', phone: '138****5678', lastTime: '3天前',
    icon: '🏪', avatarBg: '#fff3e0', avatarColor: '#e65100',
    status: '接洽中', statusBg: '#e4edfa', statusColor: '#1a4a8a', statusVal: 'contact'
  },
  {
    id: 2, name: '芳香咖啡', contact: '张明', phone: '139****1234', lastTime: '1天前',
    icon: '☕', avatarBg: '#e4edfa', avatarColor: '#1f4788',
    status: '接洽中', statusBg: '#e4edfa', statusColor: '#1a4a8a', statusVal: 'contact'
  },
  {
    id: 3, name: '鲜花花艺坊', contact: '王娟', phone: '137****9012', lastTime: '5天前',
    icon: '🌸', avatarBg: '#fce4ec', avatarColor: '#c62828',
    status: '已合作', statusBg: '#e8f5e9', statusColor: '#17794a', statusVal: 'done'
  },
  {
    id: 4, name: '轻食主义', contact: '陈勇', phone: '136****3456', lastTime: '今天',
    icon: '🥗', avatarBg: '#e8f5e9', avatarColor: '#17794a',
    status: '已合作', statusBg: '#e8f5e9', statusColor: '#17794a', statusVal: 'done'
  },
  {
    id: 5, name: '多彩潮鞋', contact: '赵红', phone: '135****7890', lastTime: '2周前',
    icon: '👟', avatarBg: '#f0f0f0', avatarColor: '#999',
    status: '已流失', statusBg: '#f0f0f0', statusColor: '#999', statusVal: 'lost'
  }
])

const filteredList = computed(() => {
  let list = followList.value
  if (keyword.value) {
    list = list.filter(i => i.name.includes(keyword.value))
  }
  if (activeFilter.value === 1) list = list.filter(i => i.statusVal === 'contact')
  if (activeFilter.value === 2) list = list.filter(i => i.statusVal === 'done')
  return list
})

function openDetail(item) {
  uni.showToast({ title: `查看：${item.name}`, icon: 'none' })
}

function submitAdd() {
  if (!form.value.name || !form.value.contact || !form.value.phone) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  uni.showToast({ title: '添加成功', icon: 'success' })
  showAddSheet.value = false
  form.value = { name: '', contact: '', phone: '', license: '', status: 'contact' }
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

.search-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  margin: 24rpx 32rpx 0;

  .search-icon { font-size: 32rpx; }

  input {
    flex: 1;
    font-size: 26rpx;
    color: #333;
  }
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

/* 表单 */
.form {
  .form-item {
    margin-bottom: 28rpx;

    .form-label {
      font-size: 26rpx;
      color: #666;
      display: block;
      margin-bottom: 12rpx;
    }

    .form-input {
      width: 100%;
      height: 88rpx;
      background: #f4f5f9;
      border-radius: 20rpx;
      padding: 0 28rpx;
      font-size: 28rpx;
      color: #333;
    }
  }

  .status-picker {
    display: flex;
    gap: 16rpx;

    .sp-item {
      flex: 1;
      height: 72rpx;
      border-radius: 20rpx;
      background: #f0f0f0;
      color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      font-weight: 500;
      transition: all 0.2s;
    }
  }

  .btn-submit {
    width: 100%;
    height: 96rpx;
    border-radius: 24rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 30rpx;
    font-weight: 600;
    border: none;
    margin-top: 12rpx;
    line-height: 1;
  }
}
</style>
