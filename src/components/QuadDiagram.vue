<template>
  <div class="quad-diagram-wrapper" ref="wrapperRef">
    <svg
      ref="svgRef"
      :viewBox="`-${svgHalf} -${svgHalf} ${svgSize} ${svgSize}`"
      class="quad-diagram-svg"
      :class="{ dragging: dragTarget !== null }"
      preserveAspectRatio="xMidYMid meet"
      @pointerdown="onPointerDown"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Center quad body illustration -->
      <g filter="url(#glow)" pointer-events="none">
        <!-- Arms -->
        <line x1="-30" y1="-30" x2="-65" y2="-65" :stroke="accentColor" stroke-width="2.5" opacity="0.7" />
        <line x1="30" y1="-30" x2="65" y2="-65" :stroke="accentColor" stroke-width="2.5" opacity="0.7" />
        <line x1="-30" y1="30" x2="-65" y2="65" :stroke="accentColor" stroke-width="2.5" opacity="0.7" />
        <line x1="30" y1="30" x2="65" y2="65" :stroke="accentColor" stroke-width="2.5" opacity="0.7" />

        <!-- Motors (circles at arm ends) -->
        <circle cx="-65" cy="-65" r="14" fill="none" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />
        <circle cx="65" cy="-65" r="14" fill="none" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />
        <circle cx="-65" cy="65" r="14" fill="none" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />
        <circle cx="65" cy="65" r="14" fill="none" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />

        <!-- Prop arcs -->
        <circle cx="-65" cy="-65" r="22" fill="none" :stroke="accentColor" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="65" cy="-65" r="22" fill="none" :stroke="accentColor" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="-65" cy="65" r="22" fill="none" :stroke="accentColor" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="65" cy="65" r="22" fill="none" :stroke="accentColor" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />

        <!-- Center body -->
        <rect x="-30" y="-30" width="60" height="60" rx="6"
          :fill="bodyFill" :stroke="accentColor" stroke-width="1.5" opacity="0.6" />

        <!-- FC board hint -->
        <rect x="-16" y="-16" width="32" height="32" rx="2"
          fill="none" :stroke="accentColor" stroke-width="0.8" opacity="0.3" stroke-dasharray="2 2" />

        <!-- Camera direction arrow -->
        <polygon points="0,-38 -6,-30 6,-30" :fill="accentColor" opacity="0.4" />
      </g>

      <!-- Clickable center hit area for reset layout (only when positions customized) -->
      <g v-if="showReset" data-center-reset="true">
        <circle
          r="35"
          fill="transparent"
          pointer-events="all"
          style="cursor: pointer;"
          @click.stop="onCenterClick"
        />
        <!-- "Reset?" confirmation label -->
        <text
          v-if="confirmingReset"
          text-anchor="middle"
          :fill="accentColor"
          font-size="9"
          font-family="Rajdhani, sans-serif"
          font-weight="700"
          y="4"
          pointer-events="none"
          opacity="0.9"
        >RESET?</text>
      </g>

      <!-- Component nodes -->
      <ComponentNode
        v-for="(pos, idx) in effectivePositions"
        :key="categories[idx].key"
        :category="categories[idx]"
        :component="store.components[categories[idx].key]"
        :status="getStatus(categories[idx].key)"
        :x="pos.x"
        :y="pos.y"
        :isSelected="store.selectedCategory === categories[idx].key"
        :isDragging="dragTarget === categories[idx].key"
        :animation="animationState.get(categories[idx].key) || null"
      />
    </svg>

    <!-- Reset layout button -->
    <button
      v-if="showReset"
      class="reset-layout-btn"
      @click="onResetLayout"
    >Reset layout</button>
  </div>
</template>

<script setup>
import { computed, ref, inject, onMounted, onUnmounted } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { useTheme } from '../composables/useTheme.js'
import { useNodePositions } from '../composables/useNodePositions.js'
import { useNodeAnimations } from '../composables/useNodeAnimations.js'
import { CATEGORIES } from '../utils/helpers.js'
import ComponentNode from './ComponentNode.vue'

const store = useBuildStore()
const { getCategoryStatus } = useCompatibility()
const { isDark } = useTheme()
const { getPosition, setPosition, resetPositions, hasOverrides } = useNodePositions()
const { animationState } = useNodeAnimations()
const wrapperRef = ref(null)
const svgRef = ref(null)
const isMobile = inject('isMobile', ref(false))

const categories = CATEGORIES
const svgSize = computed(() => isMobile.value ? 500 : 700)
const svgHalf = computed(() => svgSize.value / 2)

const accentColor = computed(() => isDark.value ? '#00f0ff' : '#0891b2')
const bodyFill = computed(() => isDark.value ? 'rgba(0,240,255,0.04)' : 'rgba(8,145,178,0.06)')

// Default circular layout positions
const defaultPositions = computed(() => {
  const radius = isMobile.value ? 170 : 240
  const count = categories.length
  return categories.map((_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })
})

// Merge defaults with any localStorage overrides
const effectivePositions = computed(() => {
  return categories.map((cat, i) => {
    const def = defaultPositions.value[i]
    return getPosition(cat.key, def.x, def.y)
  })
})

const showReset = computed(() => hasOverrides())
const confirmingReset = ref(false)
let confirmTimer = null

function onCenterClick() {
  if (confirmingReset.value) {
    // Second click — confirmed, reset
    clearTimeout(confirmTimer)
    confirmingReset.value = false
    resetPositions()
  } else {
    // First click — show confirmation
    confirmingReset.value = true
    confirmTimer = setTimeout(() => {
      confirmingReset.value = false
    }, 2500)
  }
}

function onResetLayout() {
  resetPositions()
}

// --- Drag logic ---
const dragTarget = ref(null)
const dragStartSVG = ref(null)    // SVG coords at pointerdown
const dragStartClient = ref(null) // Client coords at pointerdown
const dragThresholdMet = ref(false)
const DRAG_THRESHOLD = 5 // pixels in client space

function clientToSVG(clientX, clientY) {
  const svg = svgRef.value
  if (!svg) return null
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const inv = ctm.inverse()
  return {
    x: inv.a * clientX + inv.c * clientY + inv.e,
    y: inv.b * clientX + inv.d * clientY + inv.f,
  }
}

function findNodeKey(target) {
  // Walk up from the event target to find the component-node <g> with data-node-key
  let el = target
  while (el && el !== svgRef.value) {
    if (el.dataset && el.dataset.nodeKey) return el.dataset.nodeKey
    el = el.parentElement
  }
  return null
}

function onPointerDown(e) {
  const key = findNodeKey(e.target)
  if (!key) return

  e.preventDefault()
  const svgCoords = clientToSVG(e.clientX, e.clientY)
  if (!svgCoords) return

  dragTarget.value = key
  dragStartSVG.value = svgCoords
  dragStartClient.value = { x: e.clientX, y: e.clientY }
  dragThresholdMet.value = false

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragTarget.value) return

  const dx = e.clientX - dragStartClient.value.x
  const dy = e.clientY - dragStartClient.value.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (!dragThresholdMet.value) {
    if (dist < DRAG_THRESHOLD) return
    dragThresholdMet.value = true
  }

  const svgCoords = clientToSVG(e.clientX, e.clientY)
  if (!svgCoords) return

  // Find the node's default position index
  const idx = categories.findIndex(c => c.key === dragTarget.value)
  if (idx === -1) return

  setPosition(dragTarget.value, svgCoords.x, svgCoords.y)
}

function onPointerUp(e) {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  if (!dragTarget.value) return

  const key = dragTarget.value
  const wasDragging = dragThresholdMet.value

  dragTarget.value = null
  dragStartSVG.value = null
  dragStartClient.value = null
  dragThresholdMet.value = false

  if (!wasDragging) {
    // Treat as click — select the node
    store.selectedCategory = key
  }
}

function getStatus(key) {
  return getCategoryStatus(key)
}

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<style scoped>
.quad-diagram-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.quad-diagram-svg {
  width: 100%;
  height: 100%;
  max-width: 700px;
  max-height: 700px;
  pointer-events: none;
  touch-action: none;
}
/* Enable pointer events on the SVG during drag so pointermove reaches it */
.quad-diagram-svg.dragging {
  pointer-events: auto;
}

.reset-layout-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: var(--qc-cyan-008);
  border: 1px solid var(--qc-cyan-03);
  color: var(--qc-cyan);
  font-family: var(--font-rajdhani);
  font-weight: 600;
  font-size: 12px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}
.reset-layout-btn:hover {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  opacity: 1;
}
</style>
