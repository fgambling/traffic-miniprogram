<!--
  UniChart - 基于 uni.createCanvasContext 的轻量图表组件
  支持 type: 'line' | 'bar'
-->
<template>
  <view class="chart-wrap" :style="`height: ${height}rpx;`">
    <canvas
      :canvas-id="canvasId"
      class="chart-canvas"
      :style="`width: ${canvasW}px; height: ${canvasH}px;`"
    />
  </view>
</template>

<script setup>
import { ref, watch, onMounted, getCurrentInstance } from 'vue'

const props = defineProps({
  canvasId: { type: String, required: true },
  type: { type: String, default: 'line' },   // 'line' | 'bar'
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  height: { type: Number, default: 280 },     // rpx
  peakThreshold: { type: Number, default: 50 } // bar: 超过此值标红
})

const canvasW = ref(310)
const canvasH = ref(140)
const { proxy } = getCurrentInstance()

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  // 页面内容宽 = 窗口宽 - 左右 padding 32px*2
  canvasW.value = sys.windowWidth - 64
  // rpx 转 px：1rpx = windowWidth / 750
  canvasH.value = Math.round((props.height / 750) * sys.windowWidth)
  setTimeout(() => draw(), 150)
})

watch(() => props.data, () => {
  setTimeout(() => draw(), 80)
}, { deep: true })

function draw() {
  if (!props.data.length) return
  const ctx = uni.createCanvasContext(props.canvasId, proxy)
  const w = canvasW.value
  const h = canvasH.value
  const LABEL_H = 18 // px reserved for x-axis labels
  const DRAW_H = h - LABEL_H
  const maxVal = Math.max(...props.data, 1)

  ctx.clearRect(0, 0, w, h)

  if (props.type === 'bar') {
    drawBar(ctx, w, DRAW_H, h, maxVal)
  } else {
    drawLine(ctx, w, DRAW_H, h, maxVal)
  }

  // X 轴标签
  if (props.labels.length) {
    const step = w / props.labels.length
    props.labels.forEach((lbl, i) => {
      // 稀疏显示，避免拥挤
      if (props.labels.length <= 8 || i % 2 === 0 || i === props.labels.length - 1) {
        ctx.setFillStyle('#aaa')
        ctx.setFontSize(9)
        ctx.setTextAlign('center')
        ctx.fillText(String(lbl), step * i + step / 2, h - 2)
      }
    })
  }

  ctx.draw()
}

function drawBar(ctx, w, drawH, h, maxVal) {
  const colW = w / props.data.length
  const barW = colW * 0.55

  props.data.forEach((val, i) => {
    const barH = Math.max((val / maxVal) * drawH * 0.92, 2)
    const x = colW * i + (colW - barW) / 2
    const y = drawH - barH
    const isPeak = val >= props.peakThreshold
    ctx.setFillStyle(isPeak ? 'rgba(200,60,50,.65)' : 'rgba(31,71,136,.55)')
    ctx.fillRect(x, y, barW, barH)
  })
}

function drawLine(ctx, w, drawH, h, maxVal) {
  const n = props.data.length
  const stepX = n > 1 ? (w - 8) / (n - 1) : w

  const pts = props.data.map((val, i) => ({
    x: 4 + i * stepX,
    y: 4 + drawH - (val / maxVal) * drawH * 0.9
  }))

  // 填充区
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.lineTo(pts[pts.length - 1].x, drawH + 4)
  ctx.lineTo(pts[0].x, drawH + 4)
  ctx.closePath()
  ctx.setFillStyle('rgba(31,71,136,.07)')
  ctx.fill()

  // 折线
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.setStrokeStyle('#1f4788')
  ctx.setLineWidth(2)
  ctx.setLineCap('round')
  ctx.setLineJoin('round')
  ctx.stroke()
}
</script>

<style lang="scss" scoped>
.chart-wrap {
  width: 100%;
  overflow: hidden;

  .chart-canvas {
    display: block;
  }
}
</style>
