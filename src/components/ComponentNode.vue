<template>
  <g
    class="component-node"
    :class="{ selected: isSelected }"
    :transform="`translate(${x}, ${y})`"
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

    <!-- Clickable hit area -->
    <circle
      r="40"
      fill="transparent"
      pointer-events="all"
      style="cursor: pointer;"
      @click="$emit('select', category.key)"
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

    <!-- Inner icon -->
    <text
      text-anchor="middle"
      dominant-baseline="central"
      :fill="textColor"
      font-size="16"
      y="-1"
      pointer-events="none"
    >{{ category.icon }}</text>

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
      fill="#c5d0e0"
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
  </g>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: { type: Object, required: true },
  component: { type: Object, default: null },
  status: { type: String, default: 'empty' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  isSelected: { type: Boolean, default: false },
})

defineEmits(['select'])

const truncatedName = computed(() => {
  if (!props.component?.name) return ''
  const n = props.component.name
  return n.length > 20 ? n.slice(0, 18) + '...' : n
})

const borderColor = computed(() => {
  if (props.status === 'error') return '#ff003c'
  if (props.status === 'warning') return '#ffb800'
  if (props.status === 'ok') return '#00ff88'
  return 'rgba(0,240,255,0.3)'
})

const glowFill = computed(() => {
  if (props.status === 'error') return 'rgba(255,0,60,0.08)'
  if (props.status === 'warning') return 'rgba(255,184,0,0.08)'
  if (props.status === 'ok') return 'rgba(0,255,136,0.08)'
  return 'rgba(0,240,255,0.05)'
})

const textColor = computed(() => {
  if (props.status === 'error') return '#ff003c'
  if (props.status === 'warning') return '#ffb800'
  if (props.status === 'ok') return '#00ff88'
  return '#00f0ff'
})

const lineColor = computed(() => {
  if (props.status === 'error') return '#ff003c'
  if (props.status === 'warning') return '#ffb800'
  if (props.status === 'ok') return '#00ff88'
  return 'rgba(0,240,255,0.3)'
})
</script>
