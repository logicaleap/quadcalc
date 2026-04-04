<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <!-- Header: tabs + close -->
          <div class="modal-header">
            <div class="tab-row">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'weight' }"
                @click="activeTab = 'weight'"
              >WEIGHT</button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'cost' }"
                @click="activeTab = 'cost'"
              >COST</button>
            </div>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <!-- Content -->
          <div v-if="hasData" class="breakdown-body">
            <!-- Vertical bar chart -->
            <div class="chart-area">
              <div class="chart-bars">
                <div v-for="seg in segments" :key="seg.key" class="chart-column">
                  <span class="chart-value">{{ Math.round(seg.pct) }}%</span>
                  <div class="chart-bar-track">
                    <div
                      class="chart-bar-fill"
                      :style="{
                        height: seg.pct + '%',
                        backgroundColor: seg.color,
                        boxShadow: '0 0 6px ' + seg.color + '40'
                      }"
                    ></div>
                  </div>
                  <span class="chart-label">{{ seg.shortLabel }}</span>
                </div>
              </div>
            </div>

            <!-- Detail table -->
            <div class="breakdown-table">
              <div class="table-header">
                <span class="sortable" @click="toggleSort('name')">COMPONENT {{ sortIcon('name') }}</span>
                <span class="text-right sortable" @click="toggleSort('value')">{{ activeTab === 'weight' ? 'WEIGHT' : 'COST' }} {{ sortIcon('value') }}</span>
                <span class="text-right sortable" @click="toggleSort('pct')">% {{ sortIcon('pct') }}</span>
              </div>
              <div v-for="seg in sortedSegments" :key="seg.key" class="table-row">
                <span class="table-name">
                  <span class="legend-dot" :style="{ backgroundColor: seg.color }"></span>
                  {{ seg.label }}
                  <span v-if="seg.multiplied" class="mult-note">x4</span>
                </span>
                <span class="text-right table-value">{{ seg.formatted }}</span>
                <span class="text-right table-pct">{{ seg.pct.toFixed(1) }}%</span>
              </div>
              <div class="table-row table-total">
                <span>TOTAL</span>
                <span class="text-right">{{ totalFormatted }}</span>
                <span class="text-right">100%</span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-state">
            <div class="text-tron-text/40 text-sm">No {{ activeTab }} data yet.</div>
            <div class="text-tron-text/20 text-xs mt-1">Add components to your build to see the breakdown.</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { formatCurrency, formatWeight, CATEGORIES, CATEGORY_COLORS } from '../utils/helpers.js'

const props = defineProps({
  show: Boolean,
  initialTab: { type: String, default: 'weight' },
})

defineEmits(['close'])

const store = useBuildStore()
const activeTab = ref(props.initialTab)

watch(() => props.show, (val) => {
  if (val) activeTab.value = props.initialTab
})

const SHORT_LABELS = {
  frame: 'Frame', motors: 'Motors', propellers: 'Props', battery: 'Batt',
  fc: 'FC', esc: 'ESC', vtx: 'VTX', vtxAntenna: 'VTX Ant',
  camera: 'Cam', rx: 'RX', rxAntenna: 'RX Ant', tx: 'TX',
  goggles: 'Goggles', other: 'Other',
}

const segments = computed(() => {
  const isWeight = activeTab.value === 'weight'
  const breakdown = isWeight ? store.weightBreakdown : store.costBreakdown
  if (!breakdown.total) return []

  return CATEGORIES
    .filter(c => breakdown[c.key] > 0)
    .map(c => ({
      key: c.key,
      label: c.label,
      shortLabel: SHORT_LABELS[c.key] || c.label,
      value: breakdown[c.key],
      pct: (breakdown[c.key] / breakdown.total) * 100,
      color: CATEGORY_COLORS[c.key] || '#8d6e63',
      formatted: isWeight ? `${breakdown[c.key]}g` : formatCurrency(breakdown[c.key]),
      multiplied: c.key === 'motors' || (isWeight && c.key === 'propellers'),
    }))
})

const totalFormatted = computed(() => {
  const isWeight = activeTab.value === 'weight'
  const breakdown = isWeight ? store.weightBreakdown : store.costBreakdown
  return isWeight ? formatWeight(breakdown.total) : formatCurrency(breakdown.total)
})

const hasData = computed(() => {
  const breakdown = activeTab.value === 'weight' ? store.weightBreakdown : store.costBreakdown
  return breakdown.total > 0
})

// Table sorting
const sortBy = ref(null) // null | 'name' | 'value' | 'pct'
const sortDir = ref('desc') // 'asc' | 'desc'

function toggleSort(col) {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = col
    sortDir.value = col === 'name' ? 'asc' : 'desc'
  }
}

function sortIcon(col) {
  if (sortBy.value !== col) return ''
  return sortDir.value === 'desc' ? '▼' : '▲'
}

const sortedSegments = computed(() => {
  if (!sortBy.value) return segments.value
  const items = [...segments.value]
  const dir = sortDir.value === 'asc' ? 1 : -1
  if (sortBy.value === 'name') {
    items.sort((a, b) => a.label.localeCompare(b.label) * dir)
  } else if (sortBy.value === 'value') {
    items.sort((a, b) => (a.value - b.value) * dir)
  } else if (sortBy.value === 'pct') {
    items.sort((a, b) => (a.pct - b.pct) * dir)
  }
  return items
})

// Reset sort when tab changes
watch(activeTab, () => { sortBy.value = null })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--qc-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 520px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--qc-cyan-01);
}

.tab-row {
  display: flex;
  gap: 0;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--qc-text-muted);
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 4px 16px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  color: var(--qc-cyan-05);
}
.tab-btn.active {
  color: var(--qc-cyan);
  border-bottom-color: var(--qc-cyan);
  text-shadow: var(--qc-glow-text-cyan);
}

/* Chart */
.chart-area {
  margin-bottom: 16px;
}
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 140px;
  padding: 0 4px;
}
.chart-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
  height: 100%;
}
.chart-value {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: var(--qc-text-muted);
  flex-shrink: 0;
  height: 14px;
}
.chart-bar-track {
  width: 100%;
  max-width: 28px;
  flex: 1;
  position: relative;
  background: var(--qc-cyan-005);
  border-radius: 2px 2px 0 0;
  overflow: hidden;
}
.chart-bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
}
.chart-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  color: var(--qc-text-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  height: 14px;
  flex-shrink: 0;
}

/* Table */
.breakdown-table {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
}
.table-header {
  display: grid;
  grid-template-columns: 1fr 80px 50px;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--qc-cyan-02);
  font-size: 9px;
  color: var(--qc-text-muted);
  letter-spacing: 1px;
}
.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}
.sortable:hover {
  color: var(--qc-cyan);
}
.table-row {
  display: grid;
  grid-template-columns: 1fr 80px 50px;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid var(--qc-cyan-005);
  color: var(--qc-text);
}
.table-total {
  border-top: 1px solid var(--qc-cyan-02);
  border-bottom: none;
  color: var(--color-tron-text-bright);
  font-weight: 600;
  margin-top: 2px;
  padding-top: 6px;
}
.table-name {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mult-note {
  font-size: 8px;
  color: var(--qc-text-muted);
  opacity: 0.6;
}
.table-value {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
}
.table-pct {
  color: var(--qc-text-muted);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.text-right {
  text-align: right;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }
  .chart-label {
    font-size: 7px;
  }
}
</style>
