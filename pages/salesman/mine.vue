<template>
  <view class="page">
    <!-- Header -->
    <view class="profile-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="header-inner">
        <view class="avatar">{{ avatarText }}</view>
        <text class="user-name">{{ profile.name || userInfo?.nickname || '业务员' }}</text>
        <text class="user-phone">{{ profile.phone || '—' }}</text>
        <view class="status-badge" :class="profile.status === 1 ? 'badge-ok' : 'badge-off'">
          {{ profile.status === 1 ? '● 账号正常' : '● 账号停用' }}
        </view>
      </view>
    </view>

    <scroll-view class="scroll-area" scroll-y>

      <!-- 档案信息 -->
      <view class="section-label">档案信息</view>
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">所属地区</text>
          <text class="info-value">{{ [profile.province, profile.city, profile.adminDistrict].filter(Boolean).join(' · ') || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">所属片区</text>
          <text class="info-value">{{ profile.district || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">所属行业</text>
          <text class="info-value">{{ profile.industry || '—' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">员工类别</text>
          <text class="info-value">{{ CATEGORY_LABEL[profile.employeeCategory] || '—' }}</text>
        </view>
      </view>

      <!-- 账号设置 -->
      <view class="section-label">账号设置</view>
      <view class="menu-card">
        <view class="menu-item" @click="openEdit">
          <view class="menu-left">
            <text class="menu-icon">👤</text>
            <text class="menu-text">修改信息</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-divider" />
        <view class="menu-item" @click="openChangePwd">
          <view class="menu-left">
            <text class="menu-icon">🔒</text>
            <text class="menu-text">修改密码</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="section-label">其他</view>
      <view class="menu-card">
        <view class="menu-item danger" @click="confirmLogout">
          <view class="menu-left">
            <text class="menu-icon">🚪</text>
            <text class="menu-text danger-text">退出登录</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="tab-spacer" />
    </scroll-view>

    <TabBar role="salesman" :current="3" />

    <!-- 修改信息弹层 -->
    <BottomSheet :show="showEditSheet" title="修改信息" @close="showEditSheet = false">
      <view class="form">
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input v-model="editForm.name" class="form-input" placeholder="请输入姓名" />
        </view>
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input v-model="editForm.phone" class="form-input" placeholder="请输入手机号" type="number" />
          <text class="form-tip">⚠️ 手机号同时作为登录账号，修改后需用新号重新登录</text>
        </view>
        <view class="form-item">
          <text class="form-label">所属省市 <text class="required">*</text></text>
          <picker mode="region" :value="regionPickerValue" @change="onRegionChange">
            <view class="form-input picker-input">
              <text :class="regionDisplay ? '' : 'picker-placeholder'">{{ regionDisplay || '请选择省 / 市' }}</text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">所属片区</text>
          <input v-model="editForm.district" class="form-input" placeholder="如：天河片区（选填）" />
        </view>
        <view class="form-item">
          <text class="form-label">所属行业</text>
          <input v-model="editForm.industry" class="form-input" placeholder="如：餐饮（选填）" />
        </view>
        <button class="btn-submit" @click="submitEdit" :disabled="submittingEdit">
          {{ submittingEdit ? '保存中...' : '保存' }}
        </button>
      </view>
    </BottomSheet>

    <!-- 修改密码弹层 -->
    <BottomSheet :show="showPwdSheet" title="修改密码" @close="showPwdSheet = false">
      <view class="form">
        <view class="form-item">
          <text class="form-label">原密码</text>
          <input v-model="pwdForm.oldPassword" class="form-input" placeholder="请输入原密码" password />
        </view>
        <view class="form-item">
          <text class="form-label">新密码</text>
          <input v-model="pwdForm.newPassword" class="form-input" placeholder="请输入新密码" password />
        </view>
        <view class="form-item">
          <text class="form-label">确认新密码</text>
          <input v-model="pwdForm.confirmPassword" class="form-input" placeholder="再次输入新密码" password />
        </view>
        <button class="btn-submit" @click="submitChangePwd" :disabled="submittingPwd">
          {{ submittingPwd ? '提交中...' : '确认修改' }}
        </button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { useUserStore } from '../../store/user.js'
import { statusBarHeight } from '../../utils/system.js'
import { get, put } from '../../utils/request.js'

const { state, logout } = useUserStore()
const userInfo = state.userInfo

const profile = ref({ id: '', name: '', phone: '', totalCommission: 0, balance: 0, status: 1, province: '', city: '', adminDistrict: '', district: '', industry: '', employeeCategory: null })

const CATEGORY_LABEL = { 1: '全职', 2: '兼职', 3: '总公司员工', 4: '分公司员工' }
const avatarText = computed(() => (profile.value.name || userInfo?.nickname || '业')[0])

// ─── 修改信息 ─────────────────────────────────────────────
const showEditSheet = ref(false)
const editForm = ref({ name: '', phone: '', province: '', city: '', adminDistrict: '', district: '', industry: '' })

const regionPickerValue = computed(() => [
  editForm.value.province     || '',
  editForm.value.city         || '',
  editForm.value.adminDistrict|| ''
])
const regionDisplay = computed(() =>
  [editForm.value.province, editForm.value.city, editForm.value.adminDistrict].filter(Boolean).join(' · ')
)
function onRegionChange(e) {
  const [province, city, adminDistrict] = e.detail.value
  editForm.value.province      = province
  editForm.value.city          = city
  editForm.value.adminDistrict = adminDistrict
}
const submittingEdit = ref(false)

function openEdit() {
  editForm.value = {
    name:         profile.value.name,
    phone:        profile.value.phone,
    province:     profile.value.province,
    city:         profile.value.city,
    adminDistrict:profile.value.adminDistrict,
    district:     profile.value.district,
    industry:     profile.value.industry
  }
  showEditSheet.value = true
}

async function submitEdit() {
  if (!editForm.value.name.trim())     { uni.showToast({ title: '姓名不能为空',     icon: 'none' }); return }
  if (!editForm.value.phone.trim())    { uni.showToast({ title: '手机号不能为空',   icon: 'none' }); return }
  if (!editForm.value.province.trim()) { uni.showToast({ title: '所属省份不能为空', icon: 'none' }); return }
  if (!editForm.value.city.trim())     { uni.showToast({ title: '所属城市不能为空', icon: 'none' }); return }
  submittingEdit.value = true
  try {
    await put('/api/salesman/profile', {
      name:         editForm.value.name.trim(),
      phone:        editForm.value.phone.trim(),
      province:     editForm.value.province.trim(),
      city:         editForm.value.city.trim(),
      adminDistrict:editForm.value.adminDistrict.trim(),
      district:     editForm.value.district.trim(),
      industry:     editForm.value.industry.trim()
    })
    await fetchProfile()
    uni.showToast({ title: '信息已更新', icon: 'success' })
    showEditSheet.value = false
  } catch (e) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
  } finally {
    submittingEdit.value = false
  }
}

// ─── 修改密码 ─────────────────────────────────────────────
const showPwdSheet  = ref(false)
const pwdForm       = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const submittingPwd = ref(false)

function openChangePwd() {
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  showPwdSheet.value = true
}

async function submitChangePwd() {
  const old = pwdForm.value.oldPassword.trim()
  const nw  = pwdForm.value.newPassword.trim()
  const cfm = pwdForm.value.confirmPassword.trim()
  if (!old) { uni.showToast({ title: '请输入原密码', icon: 'none' }); return }
  if (!nw)  { uni.showToast({ title: '请输入新密码', icon: 'none' }); return }
  if (!cfm) { uni.showToast({ title: '请再次输入新密码', icon: 'none' }); return }
  if (nw !== cfm) { uni.showToast({ title: '两次新密码不一致', icon: 'none' }); return }
  submittingPwd.value = true
  try {
    await put('/api/salesman/profile', { oldPassword: old, newPassword: nw })
    uni.showToast({ title: '密码已修改', icon: 'success' })
    showPwdSheet.value = false
  } catch (e) {
    uni.showToast({ title: e?.message || '修改失败', icon: 'none' })
  } finally {
    submittingPwd.value = false
  }
}

async function fetchProfile() {
  try {
    const data = await get('/api/salesman/profile', {}, { showLoad: false })
    profile.value = {
      id: data.id || '',
      name: data.name || '',
      phone: data.phone || '',
      totalCommission: Number(data.totalCommission) || 0,
      balance: Number(data.balance) || 0,
      status: data.status ?? 1,
      province:      data.province      || '',
      city:          data.city          || '',
      adminDistrict: data.adminDistrict || '',
      district:      data.district      || '',
      industry:      data.industry      || '',
      employeeCategory: data.employeeCategory || null
    }
  } catch (e) {}
}

onMounted(fetchProfile)

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmText: '退出',
    confirmColor: '#c62828',
    success: ({ confirm }) => {
      if (confirm) { logout(); uni.reLaunch({ url: '/pages/login/login' }) }
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f4f5f9;
}

/* ── Header ── */
.profile-header {
  background: linear-gradient(150deg, #162d50 0%, #1f4788 100%);
  padding-bottom: 48rpx;
  flex-shrink: 0;

  .header-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 24rpx;
    gap: 12rpx;
  }

  .avatar {
    width: 140rpx;
    height: 140rpx;
    border-radius: 70rpx;
    background: rgba(255, 255, 255, 0.18);
    border: 4rpx solid rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    color: #fff;
    font-weight: 700;
    margin-bottom: 8rpx;
  }

  .user-name {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 1rpx;
  }

  .user-phone {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.6);
  }

  .status-badge {
    font-size: 22rpx;
    padding: 6rpx 20rpx;
    border-radius: 30rpx;
    margin-top: 4rpx;

    &.badge-ok {
      background: rgba(52, 199, 89, 0.2);
      color: #a8f0c0;
    }
    &.badge-off {
      background: rgba(255, 59, 48, 0.2);
      color: #ffb3ae;
    }
  }
}

/* ── Scroll ── */
.scroll-area {
  flex: 1;
  height: 0;
}

/* ── Section label ── */
.section-label {
  font-size: 24rpx;
  color: #aaa;
  font-weight: 600;
  letter-spacing: 1rpx;
  padding: 32rpx 32rpx 12rpx;
  text-transform: uppercase;
}

/* ── Info card (read-only profile fields) ── */
.info-card {
  background: #fff;
  margin: 0 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
  padding: 8rpx 32rpx;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f2f2f2;

  &:last-child { border-bottom: none; }
}

.info-label {
  font-size: 28rpx;
  color: #888;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.info-value {
  font-size: 28rpx;
  color: #1a1a2e;
  font-weight: 500;
  text-align: right;
  flex: 1;
}

/* ── Menu card ── */
.menu-card {
  background: #fff;
  margin: 0 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 32rpx;
  active-opacity: 0.6;

  &:active { background: #f7f8fa; }

  .menu-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .menu-icon {
    font-size: 36rpx;
    width: 48rpx;
    text-align: center;
  }

  .menu-text {
    font-size: 30rpx;
    color: #1a1a2e;
    font-weight: 500;
  }

  .menu-arrow {
    font-size: 36rpx;
    color: #ccc;
    font-weight: 300;
    line-height: 1;
  }

  &.danger .danger-text { color: #c62828; }
}

.menu-divider {
  height: 1rpx;
  background: #f2f2f2;
  margin: 0 32rpx;
}

/* ── Form (弹层内) ── */
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
      box-sizing: border-box;
    }

    .picker-input {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .picker-placeholder { color: #bbb; }

    .picker-arrow {
      font-size: 36rpx;
      color: #ccc;
      font-weight: 300;
      line-height: 1;
    }

    .form-tip {
      display: block;
      font-size: 22rpx;
      color: #e65100;
      margin-top: 10rpx;
      line-height: 1.5;
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
    line-height: 96rpx;
    box-sizing: border-box;
    padding: 0;

    &[disabled] { opacity: 0.6; }
  }
}

.tab-spacer { height: 120rpx; }
</style>
