<!--
  UniChart - 基于 uni.createCanvasContext 的轻量图表组件
  支持 type: 'line' | 'bar' | 'donut'
  bar      模式：触摸柱体显示 tooltip
  line     模式：触摸最近数据点显示 tooltip；showPeak=true 时常驻峰值标注
  donut    模式：data=[v1,v2,...], colors=[c1,c2,...], centerLabel=string
  compareData   ：折线对比数据（灰色虚线叠加）
  scrollable    ：数据点 > scrollThreshold 时横向可滚动
-->
<template>
  <view class="chart-wrap" :style="`height: ${height}rpx;`">
    <!-- 可横向滚动模式 -->
    <scroll-view v-if="isScrollable" scroll-x class="chart-scroll"
      :style="`width: 100%; height: ${canvasH}px;`">
      <canvas
        :canvas-id="canvasId"
        class="chart-canvas"
        :style="`width: ${canvasW}px; height: ${canvasH}px; display: block;`"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      />
    </scroll-view>
    <!-- 普通模式 -->
    <canvas
      v-else
      :canvas-id="canvasId"
      class="chart-canvas"
      :style="`width: ${canvasW}px; height: ${canvasH}px;`"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
  </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'

const props = defineProps({
  canvasId:       { type: String,  required: true },
  type:           { type: String,  default: 'line' },   // 'line' | 'bar' | 'donut'
  data:           { type: Array,   default: () => [] },
  labels:         { type: Array,   default: () => [] },
  colors:         { type: Array,   default: () => [] },  // donut: segment colors
  centerLabel:    { type: String,  default: '' },        // donut: center text
  height:         { type: Number,  default: 280 },       // rpx
  peakThreshold:  { type: Number,  default: 50 },        // bar: 超过此值标红
  drawDelay:      { type: Number,  default: 150 },       // 初次绘制延迟(ms)
  // ── 新增 ──────────────────────────────────────────────────
  compareData:    { type: Array,   default: () => [] },  // 对比折线数据
  showPeak:       { type: Boolean, default: false },     // 常驻峰值气泡标注
  scrollable:     { type: Boolean, default: false },     // 数据多时横向滚动
  scrollThreshold:{ type: Number,  default: 14 },        // 触发滚动的最少数据点数
  pointW:         { type: Number,  default: 44 }         // 滚动时每个数据点宽度(px)
})

const emit = defineEmits(['barTouch', 'barRelease', 'lineTouch', 'lineRelease'])

const canvasW = ref(310)
const canvasH = ref(140)
const { proxy } = getCurrentInstance()

// 是否启用横向滚动
const isScrollable = computed(() =>
  props.scrollable && props.type !== 'donut' && props.data.length > props.scrollThreshold
)

function updateSize() {
  const win = uni.getWindowInfo()
  const baseW = win.windowWidth - 64
  canvasW.value = isScrollable.value
    ? Math.max(baseW, props.data.length * props.pointW)
    : baseW
  canvasH.value = Math.round((props.height / 750) * win.windowWidth)
}

// ── 绘制调度：防并发 + 防抖，避免 canvas timeout ─────────────
let _drawTimer  = null   // 防抖 timer
let _drawing    = false  // 绘制进行中标志
let _pendingIdx = -1     // 待绘制的 hoveredIdx

function scheduleDraw(hoveredIdx = -1, delay = 80) {
  _pendingIdx = hoveredIdx
  if (_drawTimer) clearTimeout(_drawTimer)
  _drawTimer = setTimeout(() => {
    _drawTimer = null
    if (_drawing) {
      // 上次 draw 还没结束，再推迟 60ms
      scheduleDraw(_pendingIdx, 60)
      return
    }
    draw(_pendingIdx)
  }, delay)
}

onUnmounted(() => {
  if (_drawTimer) clearTimeout(_drawTimer)
})

onMounted(() => {
  updateSize()
  scheduleDraw(-1, props.drawDelay)
})

watch(() => props.data, () => {
  updateSize()
  scheduleDraw(-1, 80)
}, { deep: true })

watch(() => props.type, () => {
  updateSize()
  scheduleDraw(-1, 80)
})

// ── 触摸处理 ─────────────────────────────────────────────────
function onTouchStart(e) {
  if (!props.data.length) return
  const touch = e.touches[0]
  if (!touch) return
  const x = touch.x

  if (props.type === 'bar') {
    const colW = canvasW.value / props.data.length
    const idx = Math.floor(x / colW)
    if (idx >= 0 && idx < props.data.length) {
      scheduleDraw(idx, 0)
      emit('barTouch', idx)
    }
  } else if (props.type === 'line') {
    const n = props.data.length
    if (n === 0) return
    const stepX = n > 1 ? (canvasW.value - 8) / (n - 1) : canvasW.value
    const idx = Math.max(0, Math.min(n - 1, Math.round((x - 4) / stepX)))
    scheduleDraw(idx, 0)
    emit('lineTouch', idx)
  }
}

function onTouchMove(e) {
  if (!props.data.length) return
  const touch = e.touches[0]
  if (!touch) return
  const x = touch.x

  if (props.type === 'bar') {
    const colW = canvasW.value / props.data.length
    const idx = Math.floor(x / colW)
    if (idx >= 0 && idx < props.data.length) {
      scheduleDraw(idx, 0)
      emit('barTouch', idx)
    }
  } else if (props.type === 'line') {
    const n = props.data.length
    if (n === 0) return
    const stepX = n > 1 ? (canvasW.value - 8) / (n - 1) : canvasW.value
    const idx = Math.max(0, Math.min(n - 1, Math.round((x - 4) / stepX)))
    scheduleDraw(idx, 0)
    emit('lineTouch', idx)
  }
}

function onTouchEnd() {
  if (props.type === 'bar') {
    scheduleDraw(-1, 0)
    emit('barRelease')
  } else if (props.type === 'line') {
    scheduleDraw(-1, 0)
    emit('lineRelease')
  }
}

// ── 主绘制函数 ────────────────────────────────────────────────
function draw(hoveredIdx = -1) {
  if (!props.data.length) return
  _drawing = true
  const ctx = uni.createCanvasContext(props.canvasId, proxy)
  const w = canvasW.value
  const h = canvasH.value

  if (props.type === 'donut') {
    ctx.clearRect(0, 0, w, h)
    drawDonut(ctx, w, h)
    ctx.draw(false, () => { _drawing = false })
    return
  }

  const LABEL_H = 18
  const DRAW_H = h - LABEL_H
  const allVals = [...props.data, ...props.compareData].filter(v => v != null)
  const maxVal = Math.max(...allVals, 1)

  ctx.clearRect(0, 0, w, h)

  if (props.type === 'bar') {
    drawBar(ctx, w, DRAW_H, h, maxVal, hoveredIdx)
  } else {
    if (props.compareData.length) drawCompareLine(ctx, w, DRAW_H, maxVal)
    drawLine(ctx, w, DRAW_H, h, maxVal, hoveredIdx)
  }

  if (props.labels.length) {
    const n = props.labels.length
    const isLine = props.type === 'line'
    const lineStepX = n > 1 ? (w - 8) / (n - 1) : w
    const barStep   = w / n

    // 确定实际会被绘制的最大索引（隔点模式下取最后一个偶数索引）
    const lastDrawnIdx = n <= 8 ? n - 1 : (n - 1) % 2 === 0 ? n - 1 : n - 2
    props.labels.forEach((lbl, i) => {
      if (n <= 8 || i % 2 === 0) {
        const x = isLine
          ? 4 + i * lineStepX
          : barStep * i + barStep / 2
        // 首标签左对齐、末可见标签右对齐，避免超出 canvas 边界被裁剪
        const align = i === 0 ? 'left' : (i === lastDrawnIdx ? 'right' : 'center')
        ctx.setFillStyle('#aaa')
        ctx.setFontSize(9)
        ctx.setTextAlign(align)
        ctx.fillText(String(lbl), x, h - 2)
      }
    })
  }

  ctx.draw(false, () => { _drawing = false })
}

// ── 柱状图（含 tooltip）────────────────────────────────────────
function drawBar(ctx, w, drawH, h, maxVal, hoveredIdx) {
  const n = props.data.length
  const colW = w / n
  const barW = colW * 0.55

  props.data.forEach((val, i) => {
    const barH = Math.max((val / maxVal) * drawH * 0.92, 2)
    const x = colW * i + (colW - barW) / 2
    const y = drawH - barH
    const isPeak = val >= props.peakThreshold
    const isHovered = i === hoveredIdx

    // 柱体颜色：悬停时加深
    if (isHovered) {
      ctx.setFillStyle(isPeak ? 'rgba(200,60,50,.9)' : 'rgba(31,71,136,.85)')
    } else {
      ctx.setFillStyle(isPeak ? 'rgba(200,60,50,.65)' : 'rgba(31,71,136,.55)')
    }
    ctx.fillRect(x, y, barW, barH)

    // tooltip
    if (isHovered) {
      drawTooltip(ctx, w, x + barW / 2, y, String(val))
    }
  })
}

// ── tooltip 气泡 ──────────────────────────────────────────────
function drawTooltip(ctx, canvasWidth, centerX, barTopY, text) {
  const PAD_X = 10
  const PAD_Y = 6
  const FONT_SIZE = 11
  const tipH = FONT_SIZE + PAD_Y * 2
  const tipW = text.length * (FONT_SIZE * 0.65) + PAD_X * 2
  const ARROW = 5   // 小三角高度
  const R = 5       // 圆角半径

  // 气泡定位：紧贴柱顶，居中，不超出边界
  let tipX = centerX - tipW / 2
  tipX = Math.max(R, Math.min(tipX, canvasWidth - tipW - R))
  const tipY = Math.max(R, barTopY - tipH - ARROW - 4)

  // 背景圆角矩形
  ctx.setFillStyle('rgba(26,26,46,0.88)')
  ctx.beginPath()
  ctx.moveTo(tipX + R, tipY)
  ctx.lineTo(tipX + tipW - R, tipY)
  ctx.arc(tipX + tipW - R, tipY + R, R, -Math.PI / 2, 0)
  ctx.lineTo(tipX + tipW, tipY + tipH - R)
  ctx.arc(tipX + tipW - R, tipY + tipH - R, R, 0, Math.PI / 2)
  // 小三角
  const arrowCX = Math.min(Math.max(centerX, tipX + R + 6), tipX + tipW - R - 6)
  ctx.lineTo(arrowCX + ARROW, tipY + tipH)
  ctx.lineTo(arrowCX, tipY + tipH + ARROW)
  ctx.lineTo(arrowCX - ARROW, tipY + tipH)
  ctx.lineTo(tipX + R, tipY + tipH)
  ctx.arc(tipX + R, tipY + tipH - R, R, Math.PI / 2, Math.PI)
  ctx.lineTo(tipX, tipY + R)
  ctx.arc(tipX + R, tipY + R, R, Math.PI, -Math.PI / 2)
  ctx.closePath()
  ctx.fill()

  // 数值文字
  ctx.setFillStyle('#fff')
  ctx.setFontSize(FONT_SIZE)
  ctx.setTextAlign('center')
  ctx.fillText(text, tipX + tipW / 2, tipY + PAD_Y + FONT_SIZE - 1)
}

// ── 环形图（donut） ───────────────────────────────────────────
// 使用"饼图扇形 + 白色内圆"方式，避免复杂arc路径导致超时
function drawDonut(ctx, w, h) {
  const defaultColors = ['#2a5298', '#d64a7a', '#17a2b8', '#e8842a']
  const colors = props.colors.length ? props.colors : defaultColors
  const total = props.data.reduce((s, v) => s + v, 0)
  if (total === 0) return

  const cx = w / 2
  const cy = h / 2
  const outerR = Math.min(w, h) / 2 * 0.80
  const innerR = outerR * 0.55

  let startAngle = -Math.PI / 2  // 从12点方向开始

  // Step1: 画各扇形（从圆心出发的饼图切片）
  props.data.forEach((val, i) => {
    if (val <= 0) return
    const sweep = (val / total) * Math.PI * 2
    const endAngle = startAngle + sweep

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, outerR, startAngle, endAngle, false)
    ctx.closePath()
    ctx.setFillStyle(colors[i % colors.length])
    ctx.fill()

    startAngle = endAngle
  })

  // Step2: 白色内圆遮住圆心，形成环形"洞"
  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2, false)
  ctx.setFillStyle('#ffffff')
  ctx.fill()

  // Step3: 中心标签文字
  if (props.centerLabel) {
    ctx.setFillStyle('#555')
    ctx.setFontSize(11)
    ctx.setTextAlign('center')
    ctx.fillText(props.centerLabel, cx, cy + 4)
  }
}

// ── 对比折线（灰色虚线，null 值处断开）────────────────────────
function drawCompareLine(ctx, w, drawH, maxVal) {
  const n = props.compareData.length
  if (n === 0) return
  const stepX = n > 1 ? (w - 8) / (n - 1) : w
  const pts = props.compareData.map((val, i) => ({
    x: 4 + i * stepX,
    y: val != null ? 4 + drawH - (val / maxVal) * drawH * 0.9 : null
  }))

  // 分段虚线：遇到 null 抬笔
  ctx.setStrokeStyle('rgba(160,160,170,0.7)')
  ctx.setLineWidth(1.5)
  ctx.setLineDash([6, 4])
  let inSeg = false
  ctx.beginPath()
  pts.forEach(p => {
    if (p.y == null) { inSeg = false; return }
    if (!inSeg) { ctx.moveTo(p.x, p.y); inSeg = true }
    else { ctx.lineTo(p.x, p.y) }
  })
  ctx.stroke()
  ctx.setLineDash([])

  // 仅在有值的点画小圆
  if (n <= 30) {
    pts.filter(p => p.y != null).forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.setFillStyle('rgba(160,160,170,0.7)')
      ctx.fill()
    })
  }
}

// ── 折线图（含 touch highlight + 峰值标注）──────────────────────
function drawLine(ctx, w, drawH, h, maxVal, hoveredIdx = -1) {
  const n = props.data.length
  const stepX = n > 1 ? (w - 8) / (n - 1) : w

  const pts = props.data.map((val, i) => ({
    x: 4 + i * stepX,
    y: val != null ? 4 + drawH - (val / maxVal) * drawH * 0.9 : null
  }))
  const validPts = pts.filter(p => p.y != null)

  // 填充区域（只填有值的连续段的第一段，简化处理）
  if (validPts.length >= 2) {
    ctx.beginPath()
    let inSeg = false
    pts.forEach(p => {
      if (p.y == null) { inSeg = false; return }
      if (!inSeg) { ctx.moveTo(p.x, p.y); inSeg = true }
      else { ctx.lineTo(p.x, p.y) }
    })
    if (validPts.length) {
      ctx.lineTo(validPts[validPts.length - 1].x, drawH + 4)
      ctx.lineTo(validPts[0].x, drawH + 4)
    }
    ctx.closePath()
    ctx.setFillStyle('rgba(31,71,136,.07)')
    ctx.fill()
  }

  // 折线：分段绘制，null 处抬笔
  ctx.setStrokeStyle('#1f4788')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  let inSeg = false
  ctx.beginPath()
  pts.forEach(p => {
    if (p.y == null) { inSeg = false; return }
    if (!inSeg) { ctx.moveTo(p.x, p.y); inSeg = true }
    else { ctx.lineTo(p.x, p.y) }
  })
  ctx.stroke()

  // 数据点小圆（仅有值的点）
  if (n <= 20) {
    pts.forEach((p, i) => {
      if (p.y == null) return
      ctx.beginPath()
      ctx.arc(p.x, p.y, i === hoveredIdx ? 5 : 3, 0, Math.PI * 2, false)
      ctx.setFillStyle(i === hoveredIdx ? '#1f4788' : 'rgba(31,71,136,.5)')
      ctx.fill()
    })
  }

  // touch highlight：垂直辅助线 + tooltip（跳过 null 点）
  if (hoveredIdx >= 0 && hoveredIdx < n && pts[hoveredIdx].y != null) {
    const pt = pts[hoveredIdx]

    // 垂直辅助线
    ctx.beginPath()
    ctx.moveTo(pt.x, 4)
    ctx.lineTo(pt.x, drawH + 4)
    ctx.setStrokeStyle('rgba(31,71,136,0.25)')
    ctx.setLineWidth(1)
    ctx.stroke()

    // tooltip 气泡
    drawTooltip(ctx, w, pt.x, pt.y, String(props.data[hoveredIdx]))
  }

  // ── 常驻峰值标注（showPeak=true 且未触摸该点时显示）──────────
  // 样式：红色实心圆 + 正上方红色小标签（无箭头），区别于触摸时的深色气泡
  if (props.showPeak) {
    const peakVal = Math.max(...props.data)
    const peakIdx = props.data.indexOf(peakVal)
    if (peakIdx >= 0 && peakIdx !== hoveredIdx) {
      const pt = pts[peakIdx]

      // 红色实心圆点（峰值专用，比普通点大）
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
      ctx.setFillStyle('#e53935')
      ctx.fill()

      // 红色无箭头标签，紧贴圆点上方
      const text  = '▲ ' + String(peakVal)
      const FONT  = 10
      const PAD_X = 8
      const PAD_Y = 4
      const tipW  = text.length * (FONT * 0.62) + PAD_X * 2
      const tipH  = FONT + PAD_Y * 2
      const R     = 5
      let tipX = pt.x - tipW / 2
      tipX = Math.max(R, Math.min(tipX, w - tipW - R))
      const tipY = Math.max(R, pt.y - tipH - 10)

      ctx.setFillStyle('rgba(229,57,53,0.92)')
      ctx.beginPath()
      ctx.moveTo(tipX + R, tipY)
      ctx.lineTo(tipX + tipW - R, tipY)
      ctx.arc(tipX + tipW - R, tipY + R, R, -Math.PI / 2, 0)
      ctx.lineTo(tipX + tipW, tipY + tipH - R)
      ctx.arc(tipX + tipW - R, tipY + tipH - R, R, 0, Math.PI / 2)
      ctx.lineTo(tipX + R, tipY + tipH)
      ctx.arc(tipX + R, tipY + tipH - R, R, Math.PI / 2, Math.PI)
      ctx.lineTo(tipX, tipY + R)
      ctx.arc(tipX + R, tipY + R, R, Math.PI, -Math.PI / 2)
      ctx.closePath()
      ctx.fill()

      ctx.setFillStyle('#fff')
      ctx.setFontSize(FONT)
      ctx.setTextAlign('center')
      ctx.fillText(text, tipX + tipW / 2, tipY + PAD_Y + FONT - 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-wrap {
  width: 100%;
  overflow: hidden;
}

.chart-scroll {
  /* 横向滚动容器 */
  white-space: nowrap;
}

.chart-canvas {
  display: block;
}
</style>
