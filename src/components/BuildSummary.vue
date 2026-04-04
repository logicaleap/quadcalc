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
        <button class="undo-btn tron-btn" :disabled="!store.canUndo" @click="store.undo()" title="Undo (Ctrl+Z)">&#x21A9;</button>
        <button class="undo-btn tron-btn" :disabled="!store.canRedo" @click="store.redo()" title="Redo (Ctrl+Shift+Z)">&#x21AA;</button>
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
      <div class="stat-block clickable" @click="openBreakdown('cost')" title="Show cost breakdown">
        <div class="stat-value text-tron-text-bright">{{ formattedCost }}</div>
        <div class="stat-label">COST</div>
      </div>

      <!-- Weight -->
      <div class="stat-block clickable" @click="openBreakdown('weight')" title="Show weight breakdown">
        <div class="stat-value text-tron-text-bright">{{ formattedWeight }}</div>
        <div class="stat-label">WEIGHT</div>
      </div>

      <!-- TWR (always visible on desktop, hidden on mobile when empty) -->
      <div
        class="stat-block"
        :class="[twrClass, { 'hide-mobile-empty': store.thrustToWeightRatio == null, 'clickable': store.thrustToWeightRatio != null }]"
        :title="twrTooltip"
        @click="showTwrNote = !showTwrNote"
      >
        <div class="stat-value">{{ formattedTWR }}</div>
        <div class="stat-label">
          TWR
          <span v-if="twrTag" class="stat-tag" :class="twrClass">{{ twrTag }}</span>
          <span v-if="propMatch === 'oversized'" class="stat-tag prop-warn">BIG PROP</span>
          <span v-if="propMatch === 'undersized'" class="stat-tag prop-warn">SMALL PROP</span>
        </div>
      </div>

      <!-- Flight Time (always visible on desktop, hidden on mobile when empty) -->
      <div class="stat-block" :class="{ 'hide-mobile-empty': store.estimatedFlightTime == null }" :title="flightTooltip">
        <div class="stat-value text-tron-text-bright">{{ formattedFlightTime }}</div>
        <div class="stat-label">FLIGHT</div>
      </div>
    </div>

    <!-- TWR/Flight estimation note -->
    <Transition name="expand">
      <div v-if="showTwrNote && store.thrustToWeightRatio != null" class="twr-note">
        <span>{{ twrNoteText }}</span>
        <button class="twr-note-close" @click.stop="showTwrNote = false">&times;</button>
      </div>
    </Transition>

    <!-- Breakdown Modal -->
    <BreakdownModal
      :show="showBreakdownModal"
      :initial-tab="breakdownInitialTab"
      @close="showBreakdownModal = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { formatCurrency, formatWeight, formatTWR, CATEGORIES } from '../utils/helpers.js'
import BreakdownModal from './BreakdownModal.vue'

const store = useBuildStore()
const { compatibilityScore } = useCompatibility()

const totalSlots = CATEGORIES.length
const formattedCost = computed(() => formatCurrency(store.totalCost))
const formattedWeight = computed(() => formatWeight(store.totalWeight))
const formattedTWR = computed(() => store.thrustToWeightRatio != null ? formatTWR(store.thrustToWeightRatio) : '—')
const formattedFlightTime = computed(() => store.estimatedFlightTime != null ? `~${Math.round(store.estimatedFlightTime)} min` : '—')
const showTwrNote = ref(false)
const propMatch = computed(() => store.propMatchStatus)

// Breakdown modal
const showBreakdownModal = ref(false)
const breakdownInitialTab = ref('weight')
function openBreakdown(tab) {
  breakdownInitialTab.value = tab
  showBreakdownModal.value = true
}

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

const twrTag = computed(() => {
  const r = store.thrustToWeightRatio
  if (r == null) return ''
  if (r >= 10) return 'RACE'
  if (r >= 5) return 'FREESTYLE'
  if (r >= 3) return 'CRUISE'
  if (r >= 2) return 'HEAVY'
  return 'LOW'
})

const twrTooltip = computed(() => {
  if (store.thrustToWeightRatio == null) return 'Add motors + battery to calculate thrust-to-weight ratio'
  return `TWR ${store.thrustToWeightRatio.toFixed(1)}:1 — click for details`
})

const flightTooltip = computed(() => {
  if (store.estimatedFlightTime == null) return 'Add motors + battery to estimate flight time'
  return `Estimated flight time: ~${Math.round(store.estimatedFlightTime)} minutes`
})

const twrNoteText = computed(() => {
  const parts = ['Estimated with typical prop for this motor class.']
  if (propMatch.value === 'oversized') {
    parts.push('Your prop is larger than typical — real thrust may be higher but draws more current.')
  } else if (propMatch.value === 'undersized') {
    parts.push('Your prop is smaller than typical — real thrust will be lower.')
  }
  parts.push('Flight time is a rough estimate based on build class and battery size.')
  return parts.join(' ')
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-tag {
  font-size: 8px;
  padding: 0 3px;
  letter-spacing: 0.5px;
  border: 1px solid currentColor;
  opacity: 0.7;
  line-height: 1.4;
}
.stat-tag.prop-warn {
  color: var(--color-tron-yellow);
  border-color: var(--color-tron-yellow);
}

.twr-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
  padding: 6px 10px;
  background: var(--qc-cyan-005);
  border: 1px solid var(--qc-cyan-01);
  font-size: 10px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-text-muted);
  line-height: 1.5;
  max-width: 400px;
}
.twr-note-close {
  background: none;
  border: none;
  color: var(--qc-text-muted);
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}
.twr-note-close:hover {
  color: var(--qc-cyan);
}

.score-good .stat-value { color: var(--color-tron-green); }
.score-warn .stat-value { color: var(--color-tron-yellow); }
.score-bad .stat-value { color: var(--color-tron-red); }

.twr-good .stat-value { color: var(--color-tron-green); }
.twr-good .stat-tag { color: var(--color-tron-green); }
.twr-warn .stat-value { color: var(--color-tron-yellow); }
.twr-warn .stat-tag { color: var(--color-tron-yellow); }
.twr-bad .stat-value { color: var(--color-tron-red); }
.twr-bad .stat-tag { color: var(--color-tron-red); }

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
  .stat-block.hide-mobile-empty {
    display: none;
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
