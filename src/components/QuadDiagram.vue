<template>
  <div class="quad-diagram-wrapper" ref="wrapperRef">
    <svg
      :viewBox="`-${svgHalf} -${svgHalf} ${svgSize} ${svgSize}`"
      class="quad-diagram-svg"
      preserveAspectRatio="xMidYMid meet"
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
        <line x1="-30" y1="-30" x2="-65" y2="-65" stroke="#00f0ff" stroke-width="2.5" opacity="0.7" />
        <line x1="30" y1="-30" x2="65" y2="-65" stroke="#00f0ff" stroke-width="2.5" opacity="0.7" />
        <line x1="-30" y1="30" x2="-65" y2="65" stroke="#00f0ff" stroke-width="2.5" opacity="0.7" />
        <line x1="30" y1="30" x2="65" y2="65" stroke="#00f0ff" stroke-width="2.5" opacity="0.7" />

        <!-- Motors (circles at arm ends) -->
        <circle cx="-65" cy="-65" r="14" fill="none" stroke="#00f0ff" stroke-width="1.5" opacity="0.5" />
        <circle cx="65" cy="-65" r="14" fill="none" stroke="#00f0ff" stroke-width="1.5" opacity="0.5" />
        <circle cx="-65" cy="65" r="14" fill="none" stroke="#00f0ff" stroke-width="1.5" opacity="0.5" />
        <circle cx="65" cy="65" r="14" fill="none" stroke="#00f0ff" stroke-width="1.5" opacity="0.5" />

        <!-- Prop arcs -->
        <circle cx="-65" cy="-65" r="22" fill="none" stroke="#00f0ff" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="65" cy="-65" r="22" fill="none" stroke="#00f0ff" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="-65" cy="65" r="22" fill="none" stroke="#00f0ff" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />
        <circle cx="65" cy="65" r="22" fill="none" stroke="#00f0ff" stroke-width="0.5" opacity="0.25" stroke-dasharray="3 5" />

        <!-- Center body -->
        <rect x="-30" y="-30" width="60" height="60" rx="6"
          fill="rgba(0,240,255,0.04)" stroke="#00f0ff" stroke-width="1.5" opacity="0.6" />

        <!-- FC board hint -->
        <rect x="-16" y="-16" width="32" height="32" rx="2"
          fill="none" stroke="#00f0ff" stroke-width="0.8" opacity="0.3" stroke-dasharray="2 2" />

        <!-- Camera direction arrow -->
        <polygon points="0,-38 -6,-30 6,-30" fill="#00f0ff" opacity="0.4" />
      </g>

      <!-- Component nodes -->
      <ComponentNode
        v-for="(pos, idx) in nodePositions"
        :key="categories[idx].key"
        :category="categories[idx]"
        :component="store.components[categories[idx].key]"
        :status="getStatus(categories[idx].key)"
        :x="pos.x"
        :y="pos.y"
        :isSelected="store.selectedCategory === categories[idx].key"
        @select="store.selectedCategory = $event"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { CATEGORIES } from '../utils/helpers.js'
import ComponentNode from './ComponentNode.vue'

const store = useBuildStore()
const { getCategoryStatus } = useCompatibility()
const wrapperRef = ref(null)

const categories = CATEGORIES
const svgSize = 700
const svgHalf = svgSize / 2

const nodePositions = computed(() => {
  const radius = 240
  const count = categories.length
  return categories.map((_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  })
})

function getStatus(key) {
  return getCategoryStatus(key)
}
</script>

<style scoped>
.quad-diagram-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.quad-diagram-svg {
  width: 100%;
  height: 100%;
  max-width: 700px;
  max-height: 700px;
  pointer-events: none;
}
</style>
