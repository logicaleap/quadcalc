<template>
  <div class="build-summary tron-panel">
    <div class="flex items-center gap-3">
      <!-- Undo/Redo -->
      <div class="flex items-center gap-1 mr-1">
        <button class="undo-btn tron-btn" :disabled="!store.canUndo" @click="store.undo()" title="Undo">&#x21A9;</button>
        <button class="undo-btn tron-btn" :disabled="!store.canRedo" @click="store.redo()" title="Redo">&#x21AA;</button>
      </div>

      <!-- Compat Score -->
      <div class="stat-block" :class="scoreClass">
        <div class="stat-value">{{ compatibilityScore }}%</div>
        <div class="stat-label">COMPAT</div>
      </div>

      <!-- Components -->
      <div class="stat-block">
        <div class="stat-value text-tron-cyan">{{ store.filledCount }}<span class="text-tron-text/30">/{{ totalSlots }}</span></div>
        <div class="stat-label">PARTS</div>
      </div>

      <!-- Cost -->
      <div class="stat-block">
        <div class="stat-value text-tron-text-bright">{{ formattedCost }}</div>
        <div class="stat-label">COST</div>
      </div>

      <!-- Weight -->
      <div class="stat-block">
        <div class="stat-value text-tron-text-bright">{{ formattedWeight }}</div>
        <div class="stat-label">WEIGHT</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { formatCurrency, formatWeight, CATEGORIES } from '../utils/helpers.js'

const store = useBuildStore()
const { compatibilityScore } = useCompatibility()

const totalSlots = CATEGORIES.length
const formattedCost = computed(() => formatCurrency(store.totalCost))
const formattedWeight = computed(() => formatWeight(store.totalWeight))

const scoreClass = computed(() => {
  if (compatibilityScore.value >= 90) return 'score-good'
  if (compatibilityScore.value >= 60) return 'score-warn'
  return 'score-bad'
})
</script>

<style scoped>
.build-summary {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.stat-block {
  text-align: center;
  min-width: 60px;
}
.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-label {
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: rgba(197, 208, 224, 0.3);
  letter-spacing: 1px;
}

.score-good .stat-value { color: var(--color-tron-green); }
.score-warn .stat-value { color: var(--color-tron-yellow); }
.score-bad .stat-value { color: var(--color-tron-red); }

.undo-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
}
.undo-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}
</style>
