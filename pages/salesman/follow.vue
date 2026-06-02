<template>
  <view class="page">
    <view class="page-header">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="nav-bar">
        <view class="header-title">商家跟进</view>
      </view>
      <view class="header-sub">共 {{ followList.length }} 家商家</view>
    </view>

    <scroll-view
      class="scroll-area"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 搜索框 -->
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          placeholder="搜索商家名称、联系人、电话..."
          placeholder-style="color: #ccc;"
        />
        <text v-if="keyword" class="search-clear" @click="keyword = ''">✕</text>
      </view>

      <!-- Tab 过滤 -->
      <view class="tab-grid">
        <button
          v-for="(t, i) in filterTabs"
          :key="i"
          :class="{ active: activeFilter === i }"
          @click="activeFilter = i"
        >{{ t }}</button>
      </view>

      <!-- 联合跟进申请通知 -->
      <view v-if="joinRequests.length > 0" class="join-request-banner">
        <view class="jrb-title">联合跟进申请（{{ joinRequests.length }}）</view>
        <view v-for="req in joinRequests" :key="req.id" class="jrb-item">
          <view class="jrb-info">
            <text class="jrb-name">业务员「{{ req.requester_name }}」</text>
            <text class="jrb-merchant">申请联合跟进「{{ req.merchant_name }}」</text>
          </view>
          <view class="jrb-actions">
            <view class="jrb-btn accept" @click="acceptJoinRequest(req.id, req.merchant_name)">同意</view>
            <view class="jrb-btn reject" @click="rejectJoinRequest(req.id)">拒绝</view>
          </view>
        </view>
      </view>

      <!-- 跟进列表 -->
      <view v-if="filteredList.length > 0">
        <view v-for="item in filteredList" :key="item.id">
          <FollowCard
            :name="item.name"
            :sub="`${item.contact} · ${item.phone} · ${item.lastTime}`"
            :addr="item.address"
            :status="item.status"
            :status-bg="item.statusBg"
            :status-color="item.statusColor"
            :joint="item.joint"
            @click="openDetail(item)"
          />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text class="empty-icon">🔍</text>
        <text class="empty-title">暂无符合条件的商家</text>
        <text class="empty-sub">{{ keyword ? '换个关键词试试' : '点击右下角 + 添加商家' }}</text>
      </view>

      <view class="tab-spacer" />
    </scroll-view>

    <!-- FAB 新增 -->
    <view class="fab" @click="showAddSheet = true">➕</view>

    <TabBar role="salesman" :current="1" />

    <!-- ─── 详情弹层 ─── -->
    <BottomSheet :show="showDetailSheet" title="" @close="closeDetail">
      <view v-if="currentItem" class="detail-body">
        <!-- 商家名称行 -->
        <view class="detail-hero">
          <view class="detail-hero-info">
            <text class="detail-name">{{ currentItem.name }}</text>
            <text class="detail-time">最近跟进：{{ currentItem.lastTime }}</text>
          </view>
          <!-- 当前状态徽标 -->
          <view class="detail-status-badge" :style="{ background: currentItem.statusBg, color: currentItem.statusColor }">
            {{ currentItem.status }}
          </view>
        </view>

        <!-- 联系信息 -->
        <view class="detail-section">
          <view class="detail-row">
            <text class="dr-label">联系人</text>
            <text class="dr-val">{{ currentItem.contact }}</text>
          </view>
          <view class="detail-row">
            <text class="dr-label">电话</text>
            <text class="dr-val">{{ currentItem.phone }}</text>
          </view>
          <view class="detail-row" v-if="currentItem.address">
            <text class="dr-label">地址</text>
            <text class="dr-val">{{ currentItem.address }}</text>
          </view>
          <view class="detail-row" v-if="currentItem.license">
            <text class="dr-label">营业执照</text>
            <text class="dr-val">{{ currentItem.license }}</text>
          </view>
        </view>

        <!-- 待审批提示 -->
        <view v-if="detailStatus === 4" class="pending-tip">
          <text class="pending-badge">待审批</text>
          <text class="pending-desc">已提交合作申请，等待管理员审批</text>
        </view>
        <!-- 审批失败提示 -->
        <view v-if="detailStatus === 5" class="rejected-tip">
          <text class="rejected-badge">审批失败</text>
          <text class="rejected-desc">合作申请已被驳回，可重新选择跟进状态</text>
        </view>

        <!-- 共同跟进业务员 -->
        <view v-if="coSalesmen.length > 0" class="co-salesman-row">
          <text class="co-text">业务员「{{ coSalesmen.join('、') }}」也在跟进此商家</text>
        </view>

        <!-- ── 操作按钮（已失效只保留更新状态+删除） ── -->
        <view class="action-bar">
          <view v-if="detailStatus !== 3 && detailStatus !== 2" class="action-btn" :class="{ active: activePanel === 'info' }" @click="togglePanel('info')">
            <text class="action-icon">✏️</text>
            <text class="action-label">更改信息</text>
          </view>
          <view class="action-btn" :class="{ active: activePanel === 'status' }" @click="togglePanel('status')">
            <text class="action-icon">🔄</text>
            <text class="action-label">更新状态</text>
          </view>
          <view v-if="detailStatus !== 3" class="action-btn" :class="{ active: activePanel === 'record' }" @click="togglePanel('record')">
            <text class="action-icon">📝</text>
            <text class="action-label">添加记录</text>
          </view>
          <view v-if="detailStatus === 2" class="action-btn" :class="{ active: activePanel === 'bizinfo' }" @click="togglePanel('bizinfo')">
            <text class="action-icon">🏪</text>
            <text class="action-label">门店信息</text>
          </view>
          <view v-if="detailStatus === 3" class="action-btn action-btn-danger" @click="deleteFollow">
            <text class="action-icon">🗑️</text>
            <text class="action-label">删除记录</text>
          </view>
        </view>

        <!-- ── 更改信息面板 ── -->
        <view v-if="activePanel === 'info'" class="panel panel-info">
          <view class="panel-field">
            <text class="pf-label">商家名称</text>
            <input v-model="editForm.name" class="pf-input" placeholder="商家名称" />
          </view>
          <view class="panel-field">
            <text class="pf-label">联系人</text>
            <input v-model="editForm.contact" class="pf-input" placeholder="联系人姓名" />
          </view>
          <view class="panel-field">
            <text class="pf-label">联系电话</text>
            <input v-model="editForm.phone" class="pf-input" placeholder="手机号" type="number" />
            <text class="pf-tip">⚠️ 手机号同时作为商家的登录账号，修改后需用新号登录</text>
          </view>
          <view class="panel-field">
            <text class="pf-label">商家地址</text>
            <input v-model="editForm.address" class="pf-input" placeholder="详细地址" />
          </view>
          <view class="panel-field">
            <text class="pf-label">营业执照</text>
            <input v-model="editForm.license" class="pf-input" placeholder="营业执照号（选填）" />
          </view>
          <button class="btn-panel-submit" @click="saveInfo" :disabled="savingInfo">
            {{ savingInfo ? '保存中...' : '保存信息' }}
          </button>
        </view>

        <!-- ── 更新状态面板 ── -->
        <view v-if="activePanel === 'status'" class="panel panel-status">
          <!-- 已失效：终止状态，不可修改 -->
          <view v-if="detailStatus === 3" class="lost-tip">
            <text class="lost-icon">🚫</text>
            <view class="lost-text-wrap">
              <text class="lost-title">该商家已失效</text>
              <text class="lost-desc">已失效商家无法修改状态，如需重新跟进请重新添加</text>
            </view>
          </view>
          <!-- 已合作：不可修改状态 -->
          <view v-else-if="detailStatus === 2" class="lost-tip">
            <text class="lost-icon">✅</text>
            <view class="lost-text-wrap">
              <text class="lost-title">该商家已合作</text>
              <text class="lost-desc">已合作商家无法修改状态</text>
            </view>
          </view>
          <!-- 待审批：审批中不可修改状态 -->
          <view v-else-if="detailStatus === 4" class="pending-tip">
            <text class="pending-badge">待审批</text>
            <text class="pending-desc">合作申请正在审批中，审批结果出来前无法更改状态</text>
          </view>
          <!-- 接洽中 / 审批失败：可修改状态 -->
          <view v-else>
            <!-- 审批失败时额外提示 -->
            <view v-if="detailStatus === 5" class="rejected-tip" style="margin-bottom:16rpx">
              <text class="rejected-badge">审批失败</text>
              <text class="rejected-desc">合作申请已被驳回，请重新选择跟进状态</text>
            </view>
            <!-- 状态选择器 -->
            <view class="status-picker">
              <view
                v-for="opt in allStatusOptions"
                :key="opt.value"
                class="sp-item"
                :class="{ active: newStatus === opt.value }"
                :style="newStatus === opt.value ? { background: opt.bg, color: opt.color, borderColor: opt.color } : {}"
                @click="newStatus = opt.value"
              >{{ opt.label }}</view>
            </view>
            <!-- 已合作：合作金额（必填） -->
            <view v-if="newStatus === 2" class="panel-field" style="margin-top:16rpx">
              <text class="pf-label">合作金额（元）*</text>
              <input
                v-model="cooperationAmount"
                class="pf-input"
                placeholder="请输入合作金额"
                type="digit"
              />
            </view>
            <!-- 已合作：合作证明图片 -->
            <view v-if="newStatus === 2" class="voucher-section" style="margin-top:8rpx">
              <text class="pf-label">合作证明图片</text>
              <view v-if="detailVoucherUrl" class="voucher-preview" @click="previewVoucher">
                <image :src="toFullUrl(detailVoucherUrl)" class="voucher-img" mode="aspectFill" />
                <view class="voucher-change" @click.stop="chooseVoucher">重新上传</view>
              </view>
              <button v-else class="btn-voucher" @click="chooseVoucher">📷 上传合作证明</button>
              <text v-if="voucherUploading" class="voucher-tip">上传中...</text>
            </view>
            <!-- 备注（可选） -->
            <view class="panel-field" style="margin-top:16rpx">
              <text class="pf-label">备注（可选）</text>
              <textarea
                v-model="statusRemark"
                class="note-input"
                placeholder="添加状态变更说明..."
                placeholder-style="color:#ccc"
                :maxlength="200"
              />
            </view>
            <button class="btn-panel-submit" @click="saveStatus" :disabled="savingStatus">
              {{ savingStatus ? '保存中...' : '确认更新' }}
            </button>
          </view>
        </view>

        <!-- ── 添加记录面板 ── -->
        <view v-if="activePanel === 'record'" class="panel panel-record">
          <textarea
            v-model="newRecordContent"
            class="note-input"
            placeholder="记录跟进情况..."
            placeholder-style="color: #ccc;"
            :maxlength="500"
          />
          <!-- 图片附件 -->
          <view v-if="newRecordImageUrl" class="record-img-preview" @click="previewRecordImg">
            <image :src="toFullUrl(newRecordImageUrl)" class="record-img" mode="aspectFill" />
            <view class="record-img-remove" @click.stop="newRecordImageUrl = ''">✕</view>
          </view>
          <view v-else class="btn-add-img" @click="chooseRecordImage">
            <text>📷 添加图片（选填）</text>
          </view>
          <text v-if="recordImgUploading" class="voucher-tip">图片上传中...</text>
          <button class="btn-panel-submit" @click="submitRecord" :disabled="submittingRecord">
            {{ submittingRecord ? '提交中...' : '提交记录' }}
          </button>
        </view>

        <!-- ── 门店信息面板 ── -->
        <view v-if="activePanel === 'bizinfo'" class="panel panel-bizinfo">
          <view v-if="bizLoading" class="bizinfo-loading"><text>加载中...</text></view>
          <template v-else>
            <view class="biz-section-label">店铺业态</view>
            <view class="biz-type-grid">
              <view v-for="t in businessTypes" :key="t.value"
                class="biz-type-tag" :class="{ active: bizForm.businessType === t.value }"
                @click="onBizTypeTag(t.value)">{{ t.label }}</view>
            </view>
            <input v-if="bizForm.businessType === '其他' || (!businessTypes.find(t => t.value === bizForm.businessType) && bizForm.businessType)"
              v-model="bizCustomType" class="pf-input" placeholder="请输入业态名称"
              @input="bizForm.businessType = bizCustomType" />

            <view class="biz-section-label">菜单 / 商品</view>
            <textarea v-model="bizForm.menu" class="note-input"
              placeholder="列出主要商品或分类..." :maxlength="500" />
            <view class="biz-img-row">
              <view v-for="(img, idx) in bizForm.menuImages" :key="idx" class="biz-img-item"
                @click="previewBizImg(img, bizForm.menuImages)">
                <image :src="img" class="biz-img-thumb" mode="aspectFill" />
                <view class="biz-img-del" @click.stop="removeBizImg('menu', idx)">✕</view>
              </view>
              <view v-if="bizForm.menuImages.length < 3" class="biz-img-add" @click="chooseBizImg('menu')">
                <text>{{ bizImgUploading ? '上传中' : '+' }}</text>
              </view>
            </view>

            <view class="biz-section-label">当期促销活动</view>
            <textarea v-model="bizForm.promotions" class="note-input"
              placeholder="例：满30减5，学生证9折..." :maxlength="300" />
            <view class="biz-img-row">
              <view v-for="(img, idx) in bizForm.promotionImages" :key="idx" class="biz-img-item"
                @click="previewBizImg(img, bizForm.promotionImages)">
                <image :src="img" class="biz-img-thumb" mode="aspectFill" />
                <view class="biz-img-del" @click.stop="removeBizImg('promotion', idx)">✕</view>
              </view>
              <view v-if="bizForm.promotionImages.length < 3" class="biz-img-add" @click="chooseBizImg('promotion')">
                <text>{{ bizImgUploading ? '上传中' : '+' }}</text>
              </view>
            </view>

            <view class="biz-section-label">营业时间</view>
            <textarea v-model="bizForm.businessHours" class="note-input"
              placeholder="例：周一至周日 10:00-22:00" :maxlength="200" />

            <view class="biz-section-label">目标客群</view>
            <textarea v-model="bizForm.targetAudience" class="note-input"
              placeholder="例：周边写字楼白领，18-35岁..." :maxlength="300" />

            <button class="btn-panel-submit" @click="saveBizInfo" :disabled="bizSaving">
              {{ bizSaving ? '保存中...' : '保存门店信息' }}
            </button>
          </template>
        </view>

        <!-- ── 历史跟进记录时间线 ── -->
        <view class="history-section">
          <view class="history-title">历史记录</view>
          <view v-if="followHistory.length > 0">
            <view
              v-for="(rec, idx) in followHistory"
              :key="rec.id"
              class="history-item"
            >
              <view class="hi-line-wrap">
                <view class="hi-dot" :class="{ first: idx === 0, status: rec.type === 'status' }" />
                <view v-if="idx < followHistory.length - 1" class="hi-line" />
              </view>
              <view class="hi-body">
                <view class="hi-type-tag" :class="rec.type === 'status' ? 'tag-status' : 'tag-note'">
                  {{ rec.type === 'status' ? '状态' : '记录' }}
                </view>
                <text class="hi-content">{{ rec.content }}</text>
                <image v-if="rec.imageUrl" :src="toFullUrl(rec.imageUrl)" class="hi-img" mode="aspectFill"
                  @click="uni.previewImage({ urls: [toFullUrl(rec.imageUrl)], current: toFullUrl(rec.imageUrl) })" />
                <text class="hi-time">{{ formatDateTime(rec.createdAt) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="history-empty">暂无历史记录</view>
        </view>
      </view>
    </BottomSheet>

    <!-- ─── 新增跟进弹层 ─── -->
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
          <text class="form-label">商家地址 *</text>
          <input v-model="form.address" class="form-input" placeholder="请输入详细地址" />
        </view>
        <view class="form-item">
          <text class="form-label">营业执照号（选填）</text>
          <input v-model="form.license" class="form-input" placeholder="请输入营业执照号" />
        </view>
        <!-- 门店实拍图（必传） -->
        <view class="form-item">
          <text class="form-label">门店实拍图 *</text>
          <view v-if="form.storePhotoUrl" class="store-photo-preview" @click="previewStorePhoto">
            <image :src="toFullUrl(form.storePhotoUrl)" class="store-photo-img" mode="aspectFill" />
            <view class="store-photo-change" @click.stop="chooseStorePhoto">重新拍摄</view>
          </view>
          <view v-else class="btn-store-photo" @click="chooseStorePhoto">
            <text class="store-photo-icon">📷</text>
            <text class="store-photo-text">{{ storePhotoUploading ? '上传中...' : '拍摄或上传门店照片' }}</text>
          </view>
        </view>
        <view class="form-item">
          <text class="form-label">备注（选填）</text>
          <textarea v-model="form.remark" class="form-textarea" placeholder="记录初次跟进情况..." :maxlength="200" />
        </view>
        <button class="btn-submit" @click="submitAdd" :disabled="storePhotoUploading">确认添加</button>
      </view>
    </BottomSheet>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TabBar from '../../components/TabBar.vue'
import FollowCard from '../../components/FollowCard.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import { statusBarHeight } from '../../utils/system.js'
import { get, post, put, del, BASE_URL } from '../../utils/request.js'
import { getToken } from '../../utils/auth.js'

const keyword = ref('')
const activeFilter = ref(0)
const showAddSheet = ref(false)
const showDetailSheet = ref(false)
const currentItem = ref(null)
const detailStatus = ref(1)
const detailVoucherUrl = ref('')
const voucherUploading = ref(false)
const followHistory = ref([])
const coSalesmen = ref([])
const refreshing = ref(false)
const joinRequests = ref([])  // 收到的联合跟进申请

// ─── 面板状态 ────────────────────────────────────────────────
const activePanel = ref(null)   // 'info' | 'status' | 'record' | null

// ─── 门店信息面板 ────────────────────────────────────────────
const bizForm     = ref({ businessType: '', menu: '', promotions: '', businessHours: '', targetAudience: '', menuImages: [], promotionImages: [] })
const bizCustomType = ref('')
const bizLoading  = ref(false)
const bizSaving   = ref(false)
const bizImgUploading = ref(false)
const businessTypes = [
  { value: '餐饮', label: '🍜 餐饮' },
  { value: '商超', label: '🛒 商超' },
  { value: '服装', label: '👗 服装' },
  { value: '美妆', label: '💄 美妆' },
  { value: '数码', label: '📱 数码' },
  { value: '书店', label: '📚 书店' },
  { value: '健身', label: '💪 健身' },
  { value: '其他', label: '🏪 其他' },
]

function onBizTypeTag(val) {
  if (bizForm.value.businessType === val) {
    bizForm.value.businessType = ''
    bizCustomType.value = ''
  } else {
    bizForm.value.businessType = val !== '其他' ? val : bizCustomType.value
    if (val !== '其他') bizCustomType.value = ''
  }
}

async function loadBizInfo(merchantId) {
  bizLoading.value = true
  try {
    const data = await get(`/api/salesman/merchant/${merchantId}/business-info`, {}, { showLoad: false })
    if (data) {
      const bt = data.businessType || ''
      const isPreset = businessTypes.some(t => t.value !== '其他' && t.value === bt)
      bizCustomType.value = isPreset ? '' : bt
      bizForm.value = {
        businessType:   bt,
        menu:           data.menu           || '',
        promotions:     data.promotions     || '',
        businessHours:  data.businessHours  || '',
        targetAudience: data.targetAudience || '',
        menuImages:     (data.menuImages     || []).map(u => toFullUrl(u)),
        promotionImages:(data.promotionImages || []).map(u => toFullUrl(u)),
      }
    }
  } catch (_) {}
  bizLoading.value = false
}

function toRelUrl(url) {
  if (!url) return url
  return url.startsWith(BASE_URL) ? url.slice(BASE_URL.length) : url
}

async function saveBizInfo() {
  bizSaving.value = true
  try {
    await put(`/api/salesman/merchant/${currentItem.value.merchantId}/business-info`, {
      ...bizForm.value,
      menuImages:      bizForm.value.menuImages.map(toRelUrl),
      promotionImages: bizForm.value.promotionImages.map(toRelUrl),
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (_) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  bizSaving.value = false
}

function bizImgArr(target) {
  return target === 'menu' ? bizForm.value.menuImages : bizForm.value.promotionImages
}

function chooseBizImg(target) {
  if (bizImgUploading.value) return
  if (bizImgArr(target).length >= 3) { uni.showToast({ title: '最多上传3张', icon: 'none' }); return }
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => { uploadBizImg(res.tempFilePaths[0], target) }
  })
}

function uploadBizImg(tempPath, target) {
  bizImgUploading.value = true
  uni.uploadFile({
    url: `${BASE_URL}/api/salesman/upload`,
    filePath: tempPath,
    name: 'file',
    header: { Authorization: `Bearer ${getToken()}` },
    success: (res) => {
      try {
        const body = JSON.parse(res.data)
        if (body.code !== 0) throw new Error(body.message || '上传失败')
        bizImgArr(target).push(toFullUrl(body.data.url))
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '上传失败，请检查网络', icon: 'none' }),
    complete: () => { bizImgUploading.value = false }
  })
}

function removeBizImg(target, idx) {
  bizImgArr(target).splice(idx, 1)
}

function previewBizImg(url, list) {
  uni.previewImage({ urls: list.map(u => toFullUrl(u)), current: toFullUrl(url) })
}

// ─── 更改信息面板 ────────────────────────────────────────────
const editForm = ref({ name: '', contact: '', phone: '', address: '', license: '' })
const savingInfo = ref(false)

// ─── 更新状态面板 ────────────────────────────────────────────
const newStatus = ref(1)
const savingStatus = ref(false)
const statusRemark = ref('')
const cooperationAmount = ref('')

// ─── 添加记录面板 ────────────────────────────────────────────
const newRecordContent = ref('')
const newRecordImageUrl = ref('')
const recordImgUploading = ref(false)
const submittingRecord = ref(false)

// 状态配置
const statusMap = {
  1: { label: '接洽中',  bg: '#e4edfa', color: '#1a4a8a' },
  2: { label: '已合作',  bg: '#e8f5e9', color: '#17794a' },
  3: { label: '已失效',  bg: '#f0f0f0', color: '#999'    },
  4: { label: '待审批',  bg: '#fff3e0', color: '#e65100' },
  5: { label: '审批失败', bg: '#fce4ec', color: '#c62828' }
}
const allStatusOptions = [
  { value: 1, label: '接洽中', bg: '#e4edfa', color: '#1a4a8a' },
  { value: 2, label: '已合作', bg: '#e8f5e9', color: '#17794a' },
  { value: 3, label: '已失效', bg: '#f0f0f0', color: '#999'    }
]

const iconPool = ['🏪', '🍜', '☕', '🌸', '🥗', '👟', '💄', '🍰', '📱', '🏋️']
const colorPool = [
  { bg: '#fff3e0', color: '#e65100' },
  { bg: '#e4edfa', color: '#1f4788' },
  { bg: '#fce4ec', color: '#c62828' },
  { bg: '#e8f5e9', color: '#17794a' },
  { bg: '#f3e5f5', color: '#6a1b9a' },
  { bg: '#e0f7fa', color: '#00695c' }
]

function toDisplayItem(vo, idx) {
  const s = statusMap[vo.status] || statusMap[1]
  const col = colorPool[idx % colorPool.length]
  return {
    id: vo.id,
    merchantId: vo.merchantId,
    name: vo.merchantName || '未知商家',
    contact: vo.contactPerson || '',
    phone: vo.contactPhone || '',
    license: vo.licenseNo || '',
    address: vo.address || '',
    voucherUrl: vo.voucherUrl || '',
    lastTime: formatRelTime(vo.updatedAt),
    icon: iconPool[idx % iconPool.length],
    avatarBg: col.bg,
    avatarColor: col.color,
    status: s.label,
    statusBg: s.bg,
    statusColor: s.color,
    statusVal: vo.status,
    joint: (vo.coFollowCount || 0) > 0,
    note: vo.followRecord || ''
  }
}

// iOS 只支持 "yyyy/MM/dd HH:mm:ss" 或 ISO 格式，统一替换空格为 T
function parseDate(dt) {
  if (!dt) return new Date(NaN)
  return new Date(String(dt).replace(' ', 'T'))
}

function formatRelTime(dt) {
  if (!dt) return '--'
  const diff = Date.now() - parseDate(dt).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return `${Math.floor(days / 30)}个月前`
}

function formatDateTime(dt) {
  if (!dt) return '--'
  const d = parseDate(dt)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const followList = ref([])

async function loadList() {
  try {
    const data = await get('/api/salesman/follow/list', {}, { showLoad: false })
    followList.value = (data || []).map((vo, i) => toDisplayItem(vo, i))
  } catch (_) {}
}

async function loadJoinRequests() {
  try {
    const data = await get('/api/salesman/follow/join-requests/incoming', {}, { showLoad: false })
    joinRequests.value = data || []
  } catch (_) {}
}

async function acceptJoinRequest(id, merchantName) {
  uni.showModal({
    title: '同意联合跟进',
    content: `同意后对方将加入「${merchantName}」的跟进，是否确认？`,
    confirmText: '同意',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await post(`/api/salesman/follow/join-request/${id}/accept`)
        uni.showToast({ title: '已同意', icon: 'success' })
        await Promise.all([loadList(), loadJoinRequests()])
      } catch (_) { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function rejectJoinRequest(id) {
  try {
    await post(`/api/salesman/follow/join-request/${id}/reject`)
    uni.showToast({ title: '已拒绝', icon: 'none' })
    loadJoinRequests()
  } catch (_) {}
}

const contactCount  = computed(() => followList.value.filter(i => i.statusVal === 1).length)
const doneCount     = computed(() => followList.value.filter(i => i.statusVal === 2).length)
const lostCount     = computed(() => followList.value.filter(i => i.statusVal === 3).length)
const pendingCount  = computed(() => followList.value.filter(i => i.statusVal === 4).length)
const rejectedCount = computed(() => followList.value.filter(i => i.statusVal === 5).length)

const filterTabs = computed(() => [
  `全部 (${followList.value.length})`,
  `接洽中 (${contactCount.value})`,
  `待审批 (${pendingCount.value})`,
  `已合作 (${doneCount.value})`,
  `已失效 (${lostCount.value})`,
  `审批失败 (${rejectedCount.value})`
])

// tab 索引 → statusVal 映射（0=全部，无映射）
// 顺序：全部(0) 接洽中(1→1) 待审批(2→4) 已合作(3→2) 已失效(4→3) 审批失败(5→5)
const TAB_STATUS = { 1: 1, 2: 4, 3: 2, 4: 3, 5: 5 }

const filteredList = computed(() => {
  let list = followList.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(i =>
      i.name.toLowerCase().includes(kw) ||
      i.contact.toLowerCase().includes(kw) ||
      i.phone.includes(kw)
    )
  }
  const sv = TAB_STATUS[activeFilter.value]
  if (sv !== undefined) list = list.filter(i => i.statusVal === sv)
  return list
})

async function openDetail(item) {
  currentItem.value = item
  detailStatus.value = item.statusVal
  // 审批失败时默认回到接洽中，因为 5 不是可选状态
  newStatus.value = item.statusVal === 5 ? 1 : item.statusVal
  detailVoucherUrl.value = item.voucherUrl || ''
  statusRemark.value = ''
  cooperationAmount.value = ''
  followHistory.value = []
  coSalesmen.value = []
  activePanel.value = null
  // 预填编辑表单
  editForm.value = {
    name: item.name,
    contact: item.contact,
    phone: item.phone,
    address: item.address,
    license: item.license
  }
  showDetailSheet.value = true

  // 并行加载历史记录 + 共同跟进业务员
  const [histRes, coRes] = await Promise.allSettled([
    get(`/api/salesman/follow/${item.id}/records`, {}, { showLoad: false }),
    get(`/api/salesman/merchant/${item.merchantId}/followers`, {}, { showLoad: false })
  ])
  if (histRes.status === 'fulfilled') followHistory.value = histRes.value || []
  if (coRes.status === 'fulfilled') coSalesmen.value = coRes.value || []
}

function closeDetail() {
  showDetailSheet.value = false
  currentItem.value = null
  activePanel.value = null
}

function togglePanel(name) {
  const prev = activePanel.value
  activePanel.value = prev === name ? null : name
  if (activePanel.value === 'bizinfo' && prev !== 'bizinfo') {
    loadBizInfo(currentItem.value.merchantId)
  }
}

// ─── 更改信息 ────────────────────────────────────────────────
async function saveInfo() {
  if (!editForm.value.name || !editForm.value.contact || !editForm.value.phone) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  savingInfo.value = true
  try {
    await put(`/api/salesman/merchant/${currentItem.value.merchantId}`, {
      name: editForm.value.name,
      contactPerson: editForm.value.contact,
      contactPhone: editForm.value.phone,
      address: editForm.value.address || undefined,
      licenseNo: editForm.value.license || undefined
    })
    // 更新列表数据
    await loadList()
    // 更新 currentItem 显示
    const updated = followList.value.find(i => i.id === currentItem.value.id)
    if (updated) currentItem.value = updated
    uni.showToast({ title: '信息已更新', icon: 'success' })
    activePanel.value = null
  } catch (_) {
    uni.showToast({ title: '更新失败', icon: 'none' })
  } finally {
    savingInfo.value = false
  }
}

// ─── 更新状态 ────────────────────────────────────────────────
async function saveStatus() {
  if (newStatus.value === 2 && !cooperationAmount.value) {
    uni.showToast({ title: '请填写合作金额', icon: 'none' })
    return
  }
  savingStatus.value = true
  try {
    const body = {
      status: newStatus.value,
      voucherUrl: detailVoucherUrl.value || undefined,
      remark: statusRemark.value.trim() || undefined,
      amount: newStatus.value === 2 ? Number(cooperationAmount.value) : undefined
    }
    await put(`/api/salesman/follow/${currentItem.value.id}`, body)
    statusRemark.value = ''
    cooperationAmount.value = ''
    await loadList()
    const updatedItem = followList.value.find(i => i.id === currentItem.value.id)
    if (updatedItem) {
      currentItem.value = updatedItem
      detailStatus.value = updatedItem.statusVal
      newStatus.value = updatedItem.statusVal === 5 ? 1 : updatedItem.statusVal
    }
    // 刷新历史记录
    const histRes = await get(`/api/salesman/follow/${currentItem.value.id}/records`, {}, { showLoad: false }).catch(() => [])
    followHistory.value = histRes || []
    uni.showToast({ title: '状态已更新', icon: 'success' })
    activePanel.value = null
  } catch (e) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' })
  } finally {
    savingStatus.value = false
  }
}

// ─── 删除已失效跟进 ──────────────────────────────────────────
async function deleteFollow() {
  uni.showModal({
    title: '确认删除',
    content: `确认删除「${currentItem.value.name}」的跟进记录？删除后不可恢复。`,
    confirmColor: '#e53935',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await del(`/api/salesman/follow/${currentItem.value.id}`)
        uni.showToast({ title: '已删除', icon: 'success' })
        closeDetail()
        await loadList()
      } catch (e) {
        uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
      }
    }
  })
}

// ─── 添加记录 ────────────────────────────────────────────────
async function submitRecord() {
  if (!newRecordContent.value.trim()) {
    uni.showToast({ title: '请填写记录内容', icon: 'none' })
    return
  }
  submittingRecord.value = true
  try {
    await post(`/api/salesman/follow/${currentItem.value.id}/record`, {
      content: newRecordContent.value.trim(),
      imageUrl: newRecordImageUrl.value || undefined
    })
    newRecordContent.value = ''
    newRecordImageUrl.value = ''
    // 刷新历史记录
    const histRes = await get(`/api/salesman/follow/${currentItem.value.id}/records`, {}, { showLoad: false }).catch(() => [])
    followHistory.value = histRes || []
    uni.showToast({ title: '记录已添加', icon: 'success' })
    activePanel.value = null
  } catch (_) {
    uni.showToast({ title: '提交失败', icon: 'none' })
  } finally {
    submittingRecord.value = false
  }
}

/** 将相对路径或旧的完整 URL 统一转为可访问的完整 URL */
function toFullUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url   // 旧数据已是完整 URL，直接用
  return BASE_URL + url                    // 新数据是相对路径，拼上 BASE_URL
}

function chooseRecordImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => { uploadImage(res.tempFilePaths[0], 'record') }
  })
}

function previewRecordImg() {
  if (newRecordImageUrl.value) {
    const full = toFullUrl(newRecordImageUrl.value)
    uni.previewImage({ urls: [full], current: full })
  }
}

// ─── 凭证上传 ───────────────────────────────────────────────
function chooseVoucher() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => { uploadImage(res.tempFilePaths[0], 'voucher') }
  })
}

function previewVoucher() {
  if (detailVoucherUrl.value) {
    const full = toFullUrl(detailVoucherUrl.value)
    uni.previewImage({ urls: [full], current: full })
  }
}

function uploadImage(tempPath, target) {
  if (target === 'voucher') voucherUploading.value = true
  else recordImgUploading.value = true

  uni.uploadFile({
    url: `${BASE_URL}/api/salesman/upload`,
    filePath: tempPath,
    name: 'file',
    header: { Authorization: `Bearer ${getToken()}` },
    success: (res) => {
      try {
        const body = JSON.parse(res.data)
        if (body.code !== 0) throw new Error(body.message || '上传失败')
        const url = body.data.url   // 存相对路径，显示时动态拼 BASE_URL
        if (target === 'voucher') {
          detailVoucherUrl.value = url
          uni.showToast({ title: '凭证已上传', icon: 'success' })
        } else {
          newRecordImageUrl.value = url
          uni.showToast({ title: '图片已上传', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '上传失败，请检查网络', icon: 'none' }),
    complete: () => {
      voucherUploading.value = false
      recordImgUploading.value = false
    }
  })
}

// ─── 新增商家 ────────────────────────────────────────────────
const form = ref({ name: '', contact: '', phone: '', address: '', license: '', storePhotoUrl: '', remark: '', status: 1 })
const storePhotoUploading = ref(false)

function chooseStorePhoto() {
  if (storePhotoUploading.value) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => { uploadStorePhoto(res.tempFilePaths[0]) }
  })
}

function uploadStorePhoto(tempPath) {
  storePhotoUploading.value = true
  uni.uploadFile({
    url: `${BASE_URL}/api/salesman/upload`,
    filePath: tempPath,
    name: 'file',
    header: { Authorization: `Bearer ${getToken()}` },
    success: (res) => {
      try {
        const body = JSON.parse(res.data)
        if (body.code !== 0) throw new Error(body.message || '上传失败')
        form.value.storePhotoUrl = body.data.url
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      }
    },
    fail: () => uni.showToast({ title: '上传失败，请检查网络', icon: 'none' }),
    complete: () => { storePhotoUploading.value = false }
  })
}

function previewStorePhoto() {
  if (form.value.storePhotoUrl) {
    const full = toFullUrl(form.value.storePhotoUrl)
    uni.previewImage({ urls: [full], current: full })
  }
}

async function submitAdd() {
  if (!form.value.name || !form.value.contact || !form.value.phone || !form.value.address) {
    uni.showToast({ title: '请填写所有必填项', icon: 'none' })
    return
  }
  if (!form.value.storePhotoUrl) {
    uni.showToast({ title: '请上传门店实拍图', icon: 'none' })
    return
  }

  // 重名检测：前端先检查（后端也会校验）
  const nameExists = followList.value.some(
    i => i.name.trim() === form.value.name.trim()
  )
  if (nameExists) {
    uni.showModal({
      title: '商家已存在',
      content: `"${form.value.name}" 已在您的跟进列表中，是否仍要继续添加？`,
      confirmText: '继续添加',
      success: ({ confirm }) => { if (confirm) checkLicenseAndAdd() }
    })
    return
  }
  checkLicenseAndAdd()
}

async function checkLicenseAndAdd() {
  // 有营业执照号时先检测冲突
  if (form.value.license) {
    try {
      const res = await get('/api/salesman/follow/check-license',
        { licenseNo: form.value.license }, { showLoad: false })

      // 自己已有该执照号商家（且未失效）
      if (res.type === 'mine') {
        uni.showToast({ title: '你已添加该营业执照号商家', icon: 'none', duration: 2000 })
        return
      }

      // 其他业务员已合作/待审批，无法添加
      if (res.type === 'cooperative') {
        uni.showToast({ title: `该商家已由「${res.salesmanName}」跟进合作，无法重复添加`, icon: 'none', duration: 2500 })
        return
      }

      // 其他业务员接洽中或审批失败，可申请联合跟进
      if (res.type === 'contact') {
        const followId = res.followId
        const salesmanName = res.salesmanName
        showAddSheet.value = false   // 先关闭弹层，避免遮挡 modal
        setTimeout(() => {
          uni.showModal({
            title: '申请联合跟进',
            content: `该商家正在被业务员「${salesmanName}」跟进，是否申请联合跟进？`,
            confirmText: '申请',
            cancelText: '取消',
            success: async ({ confirm }) => {
              if (!confirm) return
              try {
                await post('/api/salesman/follow/join-request', { followId })
                uni.showToast({ title: '申请已发送，等待对方确认', icon: 'none', duration: 2500 })
                resetForm()
              } catch (e) {
                uni.showToast({ title: e?.message || '申请失败', icon: 'none' })
              }
            }
          })
        }, 350)
        return
      }
    } catch (_) {
      // 检测失败时继续正常添加流程
    }
  }
  doAdd()
}

function resetForm() {
  form.value = { name: '', contact: '', phone: '', address: '', license: '', storePhotoUrl: '', remark: '', status: 1 }
}

async function doAdd() {
  try {
    await post('/api/salesman/follow/add', {
      name: form.value.name,
      contactPerson: form.value.contact,
      contactPhone: form.value.phone,
      address: form.value.address,
      licenseNo: form.value.license || undefined,
      storePhotoUrl: form.value.storePhotoUrl,
      remark: form.value.remark || undefined,
      status: form.value.status
    })
    await loadList()
    uni.showToast({ title: '添加成功', icon: 'success' })
    showAddSheet.value = false
    resetForm()
  } catch (e) {
    // 后端返回 409 时显示具体错误
    const msg = e?.message || '添加失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
}

async function onRefresh() {
  refreshing.value = true
  await Promise.all([loadList(), loadJoinRequests()])
  refreshing.value = false
  uni.showToast({ title: '已刷新', icon: 'none' })
}

onMounted(() => {
  loadList()
  loadJoinRequests()
})
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
  padding: 0 32rpx 24rpx;
  flex-shrink: 0;

  .nav-bar {
    height: 88rpx;
    display: flex;
    align-items: center;
    padding-right: 200rpx;
  }

  .header-title { font-size: 34rpx; font-weight: 600; }
  .header-sub { font-size: 24rpx; opacity: 0.7; margin-top: 4rpx; }
}

.scroll-area {
  flex: 1;
  height: 0;
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
  input { flex: 1; font-size: 26rpx; color: #333; }
  .search-clear { font-size: 24rpx; color: #bbb; padding: 4rpx 8rpx; }
}

/* Tab 两行网格 */
.tab-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 16rpx 32rpx 20rpx;

  button {
    flex: 0 0 calc(33.333% - 8rpx);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60rpx;
    border-radius: 30rpx;
    background: #fff;
    color: #999;
    font-size: 24rpx;
    border: 2rpx solid #eee;
    box-sizing: border-box;
    line-height: 1;

    &.active {
      background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
      color: #fff;
      border-color: transparent;
      font-weight: 600;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;

  .empty-icon { font-size: 96rpx; margin-bottom: 24rpx; opacity: 0.4; }
  .empty-title { font-size: 30rpx; color: #999; font-weight: 500; margin-bottom: 12rpx; }
  .empty-sub { font-size: 24rpx; color: #ccc; }
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 190rpx;
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

/* ─── 联合跟进申请通知栏 ─── */
.join-request-banner {
  margin: 16rpx 32rpx 24rpx;
  background: #fff;
  border-radius: 24rpx;
  border-left: 6rpx solid #6a1b9a;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  overflow: hidden;

  .jrb-title {
    font-size: 24rpx;
    font-weight: 600;
    color: #6a1b9a;
    padding: 20rpx 24rpx 12rpx;
    border-bottom: 1rpx solid #f3e5f5;
  }

  .jrb-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 20rpx 24rpx;
    border-bottom: 1rpx solid #fafafa;

    &:last-child { border-bottom: none; }

    .jrb-info {
      flex: 1;
      min-width: 0;

      .jrb-name {
        display: block;
        font-size: 26rpx;
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 4rpx;
      }

      .jrb-merchant {
        font-size: 22rpx;
        color: #999;
      }
    }

    .jrb-actions {
      display: flex;
      gap: 12rpx;
      flex-shrink: 0;

      .jrb-btn {
        height: 56rpx;
        padding: 0 24rpx;
        border-radius: 16rpx;
        font-size: 24rpx;
        font-weight: 600;
        display: flex;
        align-items: center;

        &.accept {
          background: #e8f5e9;
          color: #17794a;
        }

        &.reject {
          background: #f5f5f5;
          color: #999;
        }
      }
    }
  }
}

/* ─── 详情弹层 ─── */
.detail-body {
  .detail-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28rpx;

    .detail-hero-info {
      flex: 1;
      .detail-name { font-size: 32rpx; font-weight: 700; color: #1a1a2e; display: block; margin-bottom: 8rpx; }
      .detail-time { font-size: 22rpx; color: #aaa; }
    }

    .detail-status-badge {
      font-size: 22rpx;
      font-weight: 600;
      padding: 8rpx 20rpx;
      border-radius: 20rpx;
      flex-shrink: 0;
    }
  }

  .detail-section {
    background: #f7f8fc;
    border-radius: 20rpx;
    padding: 8rpx 24rpx;
    margin-bottom: 24rpx;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18rpx 0;
      border-bottom: 1rpx solid #eee;

      &:last-child { border-bottom: none; }

      .dr-label { font-size: 26rpx; color: #999; width: 140rpx; flex-shrink: 0; margin-top: 2rpx; }
      .dr-val { font-size: 26rpx; color: #1a1a2e; font-weight: 500; flex: 1; text-align: right; }
    }
  }

  /* 待审批提示 */
  .pending-tip {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #fff3e0;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    margin-bottom: 24rpx;

    .pending-badge {
      font-size: 22rpx;
      font-weight: 700;
      color: #e65100;
      background: rgba(230,81,0,.12);
      padding: 6rpx 16rpx;
      border-radius: 10rpx;
      flex-shrink: 0;
    }

    .pending-desc { font-size: 22rpx; color: #bf360c; }
  }

  /* 审批失败提示 */
  .rejected-tip {
    display: flex;
    align-items: center;
    gap: 16rpx;
    background: #fce4ec;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    margin-bottom: 24rpx;

    .rejected-badge {
      font-size: 22rpx;
      font-weight: 700;
      color: #c62828;
      background: rgba(198,40,40,.12);
      padding: 6rpx 16rpx;
      border-radius: 10rpx;
      flex-shrink: 0;
    }

    .rejected-desc { font-size: 22rpx; color: #b71c1c; }
  }

  /* 共同跟进业务员提示 */
  .co-salesman-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background: #fff8e1;
    border-radius: 16rpx;
    padding: 16rpx 20rpx;
    margin-bottom: 24rpx;

    .co-text { font-size: 24rpx; color: #856404; line-height: 1.5; }
  }

  .detail-label {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 16rpx;
    font-weight: 500;
  }
}

/* ─── 三按钮操作栏 ─── */
.action-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    background: #f4f5f9;
    border-radius: 20rpx;
    padding: 24rpx 0;
    border: 2rpx solid transparent;

    &.active {
      background: #e8effe;
      border-color: #1a4a8a;
    }

    &.action-btn-danger {
      background: #fff0f0;
      .action-label { color: #e53935; }
    }

    .action-icon { font-size: 36rpx; }
    .action-label { font-size: 24rpx; color: #444; font-weight: 500; }
  }
}

/* ─── 面板公共 ─── */
.panel {
  background: #f7f8fc;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;

  .btn-panel-submit {
    width: 100%;
    height: 88rpx;
    border-radius: 22rpx;
    background: linear-gradient(135deg, #1a4a8a, #2d6fd6);
    color: #fff;
    font-size: 28rpx;
    font-weight: 600;
    border: none;
    margin-top: 20rpx;
    line-height: 88rpx;
    box-sizing: border-box;
    padding: 0;

    &[disabled] { opacity: 0.6; }
  }
}

/* 更改信息面板 */
.biz-section-label {
  font-size: 24rpx;
  font-weight: 600;
  color: #555;
  margin: 20rpx 0 10rpx;
}

.biz-type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.biz-type-tag {
  padding: 8rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  background: #eef1f8;
  color: #555;
}

.biz-type-tag.active {
  background: #1a4a8a;
  color: #fff;
}

.bizinfo-loading {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 26rpx;
}

.panel-field {
  margin-bottom: 20rpx;

  .pf-label {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-bottom: 10rpx;
  }

  .pf-input {
    width: 100%;
    height: 80rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 26rpx;
    color: #333;
    box-sizing: border-box;
    border: 1rpx solid #eee;
  }

  .pf-tip {
    display: block;
    font-size: 22rpx;
    color: #e65100;
    margin-top: 8rpx;
    line-height: 1.5;
  }
}

/* 已失效提示 */
.lost-tip {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #fafafa;
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1rpx solid #f0f0f0;

  .lost-icon { font-size: 36rpx; flex-shrink: 0; margin-top: 2rpx; }

  .lost-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    .lost-title { font-size: 28rpx; font-weight: 600; color: #333; }
    .lost-desc  { font-size: 24rpx; color: #999; line-height: 1.5; }
  }
}

/* 状态选择器 */
.status-picker {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;

  .sp-item {
    flex: 1;
    min-width: 0;
    height: 72rpx;
    border-radius: 20rpx;
    background: #f0f0f0;
    color: #999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 500;
    border: 2rpx solid transparent;
    box-sizing: border-box;

    &.readonly {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

/* 凭证上传 */
.voucher-section {
  margin-bottom: 16rpx;

  .btn-voucher {
    width: 100%;
    height: 88rpx;
    border-radius: 22rpx;
    background: #fff;
    color: #17794a;
    font-size: 28rpx;
    font-weight: 600;
    border: 2rpx dashed #17794a;
    line-height: 88rpx;
    box-sizing: border-box;
    padding: 0;
  }

  .voucher-preview {
    position: relative;
    border-radius: 16rpx;
    overflow: hidden;
    margin-bottom: 12rpx;

    .voucher-img { width: 100%; height: 280rpx; display: block; }

    .voucher-change {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 24rpx;
      text-align: center;
      padding: 12rpx;
    }
  }

  .voucher-tip {
    display: block;
    font-size: 22rpx;
    color: #aaa;
    margin-top: 8rpx;
    text-align: center;
  }
}

/* 添加记录面板 */
.note-input {
  width: 100%;
  min-height: 140rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
  border: 1rpx solid #eee;
}

.btn-add-img {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #ccc;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
}

.record-img-preview {
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
  margin-top: 16rpx;

  .record-img { width: 100%; height: 240rpx; display: block; }

  .record-img-remove {
    position: absolute;
    top: 12rpx; right: 12rpx;
    width: 48rpx; height: 48rpx;
    border-radius: 24rpx;
    background: rgba(0,0,0,0.5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
  }
}

/* ─── 历史记录时间线 ─── */
.history-section {
  margin-top: 32rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid #f0f0f0;

  .history-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #999;
    margin-bottom: 24rpx;
  }
}

.history-item {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;

  .hi-line-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    padding-top: 8rpx;

    .hi-dot {
      width: 18rpx;
      height: 18rpx;
      border-radius: 9rpx;
      background: #ddd;
      flex-shrink: 0;

      &.first { background: #1a4a8a; }
      &.status { background: #e65100; }
    }

    .hi-line {
      flex: 1;
      width: 2rpx;
      background: #eee;
      margin-top: 6rpx;
    }
  }

  .hi-body {
    flex: 1;
    background: #f7f8fc;
    border-radius: 16rpx;
    padding: 16rpx 20rpx;
    margin-bottom: 4rpx;

    .hi-type-tag {
      display: inline-block;
      font-size: 20rpx;
      font-weight: 600;
      padding: 4rpx 14rpx;
      border-radius: 8rpx;
      margin-bottom: 10rpx;

      &.tag-note   { background: #e4edfa; color: #1a4a8a; }
      &.tag-status { background: #fff3e0; color: #e65100; }
    }

    .hi-content {
      display: block;
      font-size: 26rpx;
      color: #333;
      line-height: 1.5;
      margin-bottom: 10rpx;
    }

    .hi-img {
      width: 100%;
      height: 200rpx;
      border-radius: 12rpx;
      display: block;
      margin-bottom: 10rpx;
    }

    .hi-time {
      font-size: 22rpx;
      color: #aaa;
    }
  }
}

.history-empty {
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #ccc;
  text-align: center;
  padding: 20rpx 0;
}

/* 新增表单 */
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

    .form-textarea {
      width: 100%;
      min-height: 120rpx;
      background: #f4f5f9;
      border-radius: 20rpx;
      padding: 20rpx 28rpx;
      font-size: 28rpx;
      color: #333;
      box-sizing: border-box;
    }
  }

  .btn-store-photo {
    width: 100%;
    height: 160rpx;
    border-radius: 20rpx;
    border: 2rpx dashed #2d6fd6;
    background: #f0f5ff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    box-sizing: border-box;

    .store-photo-icon { font-size: 48rpx; }
    .store-photo-text { font-size: 26rpx; color: #2d6fd6; font-weight: 500; }
  }

  .store-photo-preview {
    position: relative;
    border-radius: 20rpx;
    overflow: hidden;

    .store-photo-img { width: 100%; height: 320rpx; display: block; }

    .store-photo-change {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: rgba(0, 0, 0, 0.45);
      color: #fff;
      font-size: 26rpx;
      text-align: center;
      padding: 14rpx;
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
  }
}

/* 门店信息图片网格 */
.biz-img-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 12rpx 0 8rpx;
}

.biz-img-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;

  .biz-img-thumb {
    width: 100%;
    height: 100%;
    display: block;
  }

  .biz-img-del {
    position: absolute;
    top: 6rpx;
    right: 6rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 20rpx;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.biz-img-add {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #c8d0e0;
  background: #f4f6fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52rpx;
  color: #aaa;
}
</style>
