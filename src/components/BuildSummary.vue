<template>
  <div class="build-summary tron-panel">
    <!-- Build Name -->
    <div class="build-name-row">
      <input
        v-model="store.buildName"
        class="build-name-input"
        placeholder="Build name..."
      />
    </div>

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
      <div class="stat-block clickable" @click="showBreakdown = !showBreakdown" :title="showBreakdown ? 'Hide weight breakdown' : 'Show weight breakdown'">
        <div class="stat-value text-tron-text-bright">{{ formattedWeight }}</div>
        <div class="stat-label">WEIGHT {{ showBreakdown ? '▼' : '▶' }}</div>
      </div>

      <!-- TWR -->
      <div v-if="store.thrustToWeightRatio != null" class="stat-block" :class="twrClass">
        <div class="stat-value">{{ formattedTWR }}</div>
        <div class="stat-label">TWR</div>
      </div>

      <!-- Flight Time -->
      <div v-if="store.estimatedFlightTime != null" class="stat-block">
        <div class="stat-value text-tron-text-bright">~{{ Math.round(store.estimatedFlightTime) }} min</div>
        <div class="stat-label">FLIGHT</div>
      </div>
    </div>

    <!-- Weight breakdown bar -->
    <Transition name="expand">
      <div v-if="showBreakdown && hasWeight" class="weight-breakdown">
        <div class="breakdown-bar">
          <div
            v-for="seg in breakdownSegments"
            :key="seg.key"
            class="bar-segment"
            :style="{ width: seg.pct + '%', backgroundColor: seg.color }"
            :title="`${seg.label}: ${seg.weight}g (${Math.round(seg.pct)}%)`"
          ></div>
        </div>
        <div class="breakdown-legend">
          <span
            v-for="seg in breakdownSegments"
            :key="seg.key"
            class="legend-item"
          >
            <span class="legend-dot" :style="{ backgroundColor: seg.color }"></span>
            {{ seg.label }} {{ seg.weight }}g
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { formatCurrency, formatWeight, formatTWR, CATEGORIES, CATEGORY_MAP } from '../utils/helpers.js'

const store = useBuildStore()
const { compatibilityScore } = useCompatibility()

const totalSlots = CATEGORIES.length
const formattedCost = computed(() => formatCurrency(store.totalCost))
const formattedWeight = computed(() => formatWeight(store.totalWeight))
const formattedTWR = computed(() => formatTWR(store.thrustToWeightRatio))
const showBreakdown = ref(false)

const scoreClass = computed(() => {
  if (compatibilityScore.value >= 90) return 'score-good'
  if (compatibilityScore.value >= 60) return 'score-warn'
  return 'score-bad'
})

const twrClass = computed(() => {
  const r = store.thrustToWeightRatio
  if (r == null) return ''
  if (r >= 4) return 'twr-good'
  if (r >= 2) return 'twr-warn'
  return 'twr-bad'
})

const CATEGORY_COLORS = {
  frame: '#00f0ff',
  motors: '#3d5afe',
  propellers: '#7c4dff',
  battery: '#ffb800',
  fc: '#00ff88',
  esc: '#ff6d00',
  vtx: '#e040fb',
  camera: '#ff003c',
  rx: '#00e5ff',
  tx: '#76ff03',
  goggles: '#ffd740',
  vtxAntenna: '#ff4081',
  rxAntenna: '#ff80ab',
  other: '#8d6e63',
}

const hasWeight = computed(() => store.weightBreakdown.total > 0)

const breakdownSegments = computed(() => {
  const bd = store.weightBreakdown
  if (!bd.total) return []
  return CATEGORIES
    .filter(c => bd[c.key] > 0)
    .map(c => ({
      key: c.key,
      label: c.label,
      weight: bd[c.key],
      pct: (bd[c.key] / bd.total) * 100,
      color: CATEGORY_COLORS[c.key] || '#8d6e63',
    }))
})
</script>

<style scoped>
.build-summary {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 14;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.build-name-row {
  margin-bottom: 4px;
}
.build-name-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--qc-cyan-015);
  color: var(--color-tron-text-bright);
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 2px 8px;
  letter-spacing: 1px;
  outline: none;
  width: 200px;
  transition: border-color 0.2s;
}
.build-name-input:focus {
  border-color: var(--color-tron-cyan);
}
.build-name-input::placeholder {
  color: var(--qc-text-muted);
}

.stat-block {
  text-align: center;
  min-width: 60px;
}
.stat-block.clickable {
  cursor: pointer;
}
.stat-block.clickable:hover .stat-label {
  color: var(--color-tron-cyan);
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
  color: var(--qc-text-muted);
  letter-spacing: 1px;
}

.score-good .stat-value { color: var(--color-tron-green); }
.score-warn .stat-value { color: var(--color-tron-yellow); }
.score-bad .stat-value { color: var(--color-tron-red); }

.twr-good .stat-value { color: var(--color-tron-green); }
.twr-warn .stat-value { color: var(--color-tron-yellow); }
.twr-bad .stat-value { color: var(--color-tron-red); }

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

.weight-breakdown {
  width: 100%;
  margin-top: 8px;
  min-width: 300px;
}

.breakdown-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  gap: 1px;
}

.bar-segment {
  min-width: 2px;
  transition: width 0.3s ease;
}

.breakdown-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-text-muted);
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .build-summary {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    width: 100%;
    padding: 6px 10px;
    overflow-x: auto;
  }
  .stat-value {
    font-size: 12px;
  }
  .stat-block {
    min-width: 50px;
  }
  .weight-breakdown {
    min-width: 250px;
  }
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
