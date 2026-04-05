<template>
  <div class="fw-diagram-wrapper" ref="wrapperRef">
    <svg
      ref="svgRef"
      :viewBox="`-${svgHalf} -${svgHalf} ${svgSize} ${svgSize}`"
      class="fw-diagram-svg"
      preserveAspectRatio="xMidYMid meet"
      @pointerdown="onPointerDown"
    >
      <defs>
        <filter id="fw-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Aircraft body illustration -->
      <g filter="url(#fw-glow)" pointer-events="none">
        <!-- Fuselage -->
        <ellipse cx="0" cy="0" rx="18" ry="90" :fill="bodyFill" :stroke="accentColor" stroke-width="1.5" opacity="0.6" />

        <!-- Wings -->
        <line x1="-140" y1="10" x2="140" y2="10" :stroke="accentColor" stroke-width="2.5" opacity="0.7" />
        <line x1="-140" y1="10" x2="-100" y2="30" :stroke="accentColor" stroke-width="1.5" opacity="0.4" />
        <line x1="140" y1="10" x2="100" y2="30" :stroke="accentColor" stroke-width="1.5" opacity="0.4" />
        <!-- Wing tips -->
        <line x1="-140" y1="10" x2="-130" y2="0" :stroke="accentColor" stroke-width="1" opacity="0.3" />
        <line x1="140" y1="10" x2="130" y2="0" :stroke="accentColor" stroke-width="1" opacity="0.3" />

        <!-- Tail (V-tail) -->
        <line x1="0" y1="80" x2="-50" y2="100" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />
        <line x1="0" y1="80" x2="50" y2="100" :stroke="accentColor" stroke-width="1.5" opacity="0.5" />

        <!-- Prop arc (pusher at rear) -->
        <circle cx="0" cy="-85" r="20" fill="none" :stroke="accentColor" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />

        <!-- Direction arrow (nose) -->
        <polygon points="0,-95 -6,-85 6,-85" :fill="accentColor" opacity="0.4" />

        <!-- Control surface hints on wings -->
        <line x1="-120" y1="20" x2="-80" y2="25" :stroke="accentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2 2" />
        <line x1="120" y1="20" x2="80" y2="25" :stroke="accentColor" stroke-width="1" opacity="0.3" stroke-dasharray="2 2" />
      </g>

      <!-- Component nodes arranged around the aircraft -->
      <ComponentNode
        v-for="(pos, idx) in nodePositions"
        :key="fwCategories[idx].key"
        :category="fwCategories[idx]"
        :component="store.fwComponents[fwCategories[idx].key]"
        :status="getStatus(fwCategories[idx].key)"
        :x="pos.x"
        :y="pos.y"
        :isSelected="store.selectedCategory === fwCategories[idx].key"
        :isDragging="false"
        :animation="null"
        :alertCount="{ errors: 0, warnings: 0 }"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref, inject } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useFwCompatibility } from '../composables/useFwCompatibility.js'
import { useTheme } from '../composables/useTheme.js'
import { FW_CATEGORIES } from '../data/fwCategories.js'
import ComponentNode from './ComponentNode.vue'

const store = useBuildStore()
const { getCategoryStatus } = useFwCompatibility()
const { isDark } = useTheme()
const isMobile = inject('isMobile', ref(false))
const wrapperRef = ref(null)
const svgRef = ref(null)

const fwCategories = FW_CATEGORIES
const svgSize = computed(() => isMobile.value ? 500 : 700)
const svgHalf = computed(() => svgSize.value / 2)

const accentColor = computed(() => isDark.value ? '#00f0ff' : '#0891b2')
const bodyFill = computed(() => isDark.value ? 'rgba(0,240,255,0.04)' : 'rgba(8,145,178,0.06)')

// Arrange 15 nodes in an elliptical layout around the aircraft
const nodePositions = computed(() => {
  const radius = isMobile.value ? 170 : 240
  const count = fwCategories.length
  return fwCategories.map((_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    return {
      x: Math.cos(angle) * radius * 1.1,
      y: Math.sin(angle) * radius * 0.85,
    }
  })
})

function getStatus(key) {
  return getCategoryStatus(key)
}

function onPointerDown(e) {
  // Find clicked node
  let el = e.target
  while (el && el !== svgRef.value) {
    if (el.dataset && el.dataset.nodeKey) {
      store.selectedCategory = el.dataset.nodeKey
      return
    }
    el = el.parentElement
  }
}
</script>

<style scoped>
.fw-diagram-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.fw-diagram-svg {
  width: 100%;
  height: 100%;
  max-width: 700px;
  max-height: 700px;
  pointer-events: none;
  touch-action: none;
}
</style>
