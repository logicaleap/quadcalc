<template>
  <g
    class="component-node"
    :class="{ selected: isSelected }"
    :transform="`translate(${x}, ${y})`"
    :data-node-key="category.key"
    :style="nodeStyle"
  >
    <!-- Connecting line from center (non-interactive) -->
    <line
      :x1="-x" :y1="-y" x2="0" y2="0"
      :stroke="lineColor"
      stroke-width="1"
      :stroke-dasharray="component ? 'none' : '4 4'"
      :class="{ 'animate-dash-flow': !component }"
      :opacity="component ? 0.6 : 0.2"
      pointer-events="none"
    />

    <!-- Clickable hit area (click handled by parent via pointer events) -->
    <circle
      r="40"
      fill="transparent"
      pointer-events="all"
      :style="cursorStyle"
    />

    <!-- Outer ring glow -->
    <circle
      r="32"
      :fill="glowFill"
      :stroke="borderColor"
      stroke-width="1.5"
      :opacity="isSelected ? 1 : 0.85"
      pointer-events="none"
    />

    <!-- Inner icon (Lucide SVG) -->
    <g
      :transform="`translate(-12, -13) scale(1)`"
      fill="none"
      :stroke="textColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      pointer-events="none"
    >
      <path v-for="(d, i) in iconData.paths" :key="'p'+i" :d="d" />
      <circle
        v-for="(c, i) in iconData.circles || []"
        :key="'c'+i"
        :cx="c.cx" :cy="c.cy" :r="c.r"
      />
      <rect
        v-for="(r, i) in iconData.rects || []"
        :key="'r'+i"
        :x="r.x" :y="r.y" :width="r.width" :height="r.height" :rx="r.rx || 0"
      />
    </g>

    <!-- Label -->
    <text
      text-anchor="middle"
      :fill="textColor"
      font-size="10"
      font-family="Rajdhani, sans-serif"
      font-weight="600"
      y="46"
      pointer-events="none"
    >{{ category.label }}</text>

    <!-- Component name (if set) -->
    <text
      v-if="component"
      text-anchor="middle"
      :fill="subtextColor"
      font-size="8"
      font-family="Share Tech Mono, monospace"
      y="58"
      opacity="0.7"
      pointer-events="none"
    >{{ truncatedName }}</text>

    <!-- Pulse effect for selected -->
    <circle
      v-if="isSelected"
      r="36"
      fill="none"
      :stroke="borderColor"
      stroke-width="1"
      opacity="0.4"
      class="animate-pulse-glow"
      pointer-events="none"
    />

    <!-- Animation overlays -->
    <circle
      v-if="animation && animation.active"
      class="node-anim-overlay"
      :class="'anim-' + animation.type"
      r="32"
      fill="none"
      :stroke="animOverlayColor"
      :stroke-width="animStrokeWidth"
      pointer-events="none"
    />
    <!-- Secondary ring for power-on / error-pulse -->
    <circle
      v-if="animation && animation.active && (animation.type === 'power-on' || animation.type === 'error-pulse')"
      class="node-anim-ring"
      :class="'anim-ring-' + animation.type"
      r="32"
      fill="none"
      :stroke="animOverlayColor"
      stroke-width="1"
      pointer-events="none"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { ICONS } from '../utils/icons.js'

const props = defineProps({
  category: { type: Object, required: true },
  component: { type: Object, default: null },
  status: { type: String, default: 'empty' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  isSelected: { type: Boolean, default: false },
  isDragging: { type: Boolean, default: false },
  animation: { type: Object, default: null },
})

const { isDark } = useTheme()

const iconData = computed(() => ICONS[props.category.icon] || { paths: [] })

const truncatedName = computed(() => {
  if (!props.component?.name) return ''
  const n = props.component.name
  return n.length > 20 ? n.slice(0, 18) + '...' : n
})

const cursorStyle = computed(() => ({
  cursor: props.isDragging ? 'grabbing' : 'grab',
}))

const nodeStyle = computed(() => {
  if (props.isDragging) return {}
  // Smooth transition when not being dragged (e.g. during reset)
  return { transition: 'transform 0.3s ease-out' }
})

const subtextColor = computed(() => isDark.value ? '#c5d0e0' : '#4a5568')

const borderColor = computed(() => {
  const red = isDark.value ? '#ff003c' : '#dc2626'
  const yellow = isDark.value ? '#ffb800' : '#d97706'
  const green = isDark.value ? '#00ff88' : '#059669'
  const cyan = isDark.value ? 'rgba(0,240,255,0.3)' : 'rgba(8,145,178,0.3)'
  if (props.status === 'error') return red
  if (props.status === 'warning') return yellow
  if (props.status === 'ok') return green
  return cyan
})

const glowFill = computed(() => {
  const red = isDark.value ? 'rgba(255,0,60,0.08)' : 'rgba(220,38,38,0.08)'
  const yellow = isDark.value ? 'rgba(255,184,0,0.08)' : 'rgba(217,119,6,0.08)'
  const green = isDark.value ? 'rgba(0,255,136,0.08)' : 'rgba(5,150,105,0.08)'
  const cyan = isDark.value ? 'rgba(0,240,255,0.05)' : 'rgba(8,145,178,0.05)'
  if (props.status === 'error') return red
  if (props.status === 'warning') return yellow
  if (props.status === 'ok') return green
  return cyan
})

const textColor = computed(() => {
  const red = isDark.value ? '#ff003c' : '#dc2626'
  const yellow = isDark.value ? '#ffb800' : '#d97706'
  const green = isDark.value ? '#00ff88' : '#059669'
  const cyan = isDark.value ? '#00f0ff' : '#0891b2'
  if (props.status === 'error') return red
  if (props.status === 'warning') return yellow
  if (props.status === 'ok') return green
  return cyan
})

const lineColor = computed(() => {
  const red = isDark.value ? '#ff003c' : '#dc2626'
  const yellow = isDark.value ? '#ffb800' : '#d97706'
  const green = isDark.value ? '#00ff88' : '#059669'
  const cyan = isDark.value ? 'rgba(0,240,255,0.3)' : 'rgba(8,145,178,0.3)'
  if (props.status === 'error') return red
  if (props.status === 'warning') return yellow
  if (props.status === 'ok') return green
  return cyan
})

const animOverlayColor = computed(() => {
  if (!props.animation) return 'transparent'
  const t = props.animation.type
  if (t === 'error-pulse') return isDark.value ? '#ff003c' : '#dc2626'
  if (t === 'ok-flash') return isDark.value ? '#00ff88' : '#059669'
  if (t === 'warning-pulse') return isDark.value ? '#ffb800' : '#d97706'
  // power-on, power-off, lock-in use the accent cyan/green
  return isDark.value ? '#00f0ff' : '#0891b2'
})

const animStrokeWidth = computed(() => {
  if (!props.animation) return 1
  const t = props.animation.type
  if (t === 'error-pulse' || t === 'power-on') return 2
  return 1.5
})
</script>
