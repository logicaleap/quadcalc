<template>
  <div class="selector-root">
    <!-- Sort and search controls -->
    <div class="selector-controls">
      <input
        v-model="search"
        type="text"
        class="tron-input flex-1 text-sm"
        placeholder="Search components..."
      />
      <select v-model="sortMode" class="tron-input sort-select text-xs">
        <option value="default">Default</option>
        <option value="price-asc">Price ↑</option>
        <option value="price-desc">Price ↓</option>
        <option value="weight-asc">Weight ↑</option>
        <option value="name">A–Z</option>
      </select>
    </div>

    <!-- Group filter chips (hidden for now — too many groups for some categories) -->
    <div v-if="false && groupLabels.length > 1" class="group-chips">
      <button
        class="group-chip"
        :class="{ active: activeGroup === null }"
        @click="activeGroup = null"
      >All</button>
      <button
        v-for="g in groupLabels"
        :key="g"
        class="group-chip"
        :class="{ active: activeGroup === g }"
        @click="activeGroup = activeGroup === g ? null : g"
      >{{ g }}</button>
    </div>

    <div class="selector-list">
      <template v-for="group in groupedItems" :key="group.label">
        <!-- Group header -->
        <div v-if="group.label && groupLabels.length > 1 && activeGroup === null" class="group-header">
          {{ group.label }}
          <span class="group-count">{{ group.items.length }}</span>
        </div>

        <div
          v-for="item in group.items"
          :key="item.id"
          class="preset-item p-2 cursor-pointer tron-border transition-all hover:border-tron-cyan/50 hover:bg-tron-cyan/5 group"
          :class="{ 'border-tron-cyan/50 bg-tron-cyan/10 selected-item': selected?.id === item.id }"
          @click="$emit('select', item)"
        >
          <div class="flex items-center justify-between">
            <span class="text-tron-text-bright text-sm font-semibold font-[Rajdhani]">{{ item.name }}</span>
            <span class="text-tron-cyan text-xs font-mono">{{ formatCost(item.cost) }}</span>
          </div>
          <p class="text-xs text-tron-text/60 mt-0.5">{{ item.description }}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            <span
              v-for="(val, key) in heroSpecs(item)"
              :key="key"
              class="spec-tag hero"
            >
              {{ key }}: {{ val }}
            </span>
            <span
              v-for="(val, key) in secondarySpecs(item)"
              :key="key"
              class="spec-tag"
            >
              {{ key }}: {{ val }}
            </span>
          </div>
        </div>
      </template>

      <div v-if="totalCount === 0" class="text-center text-tron-text/40 py-4 text-sm">
        No matching components
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatCurrency } from '../utils/helpers.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  selected: { type: Object, default: null },
  category: { type: String, default: '' },
})

defineEmits(['select'])

const search = ref('')
const sortMode = ref('default')
const activeGroup = ref(null)

// Reset search and group when items change (category switch)
watch(() => props.items, () => {
  search.value = ''
  activeGroup.value = null
  sortMode.value = 'default'
})

// Category-specific grouping keys
const GROUP_CONFIG = {
  frame: { key: 'size', label: (v) => `${v}" Frames`, heroKeys: ['size', 'wheelbase'] },
  motors: { key: 'size', label: (v) => `${v} Motors`, heroKeys: ['size', 'kv', 'thrust_grams'] },
  propellers: { key: 'size', label: (v) => `${v}" Props`, heroKeys: ['size', 'pitch'] },
  battery: { key: 'cells', label: (v) => `${v}`, heroKeys: ['cells', 'capacity', 'dischargeContinuous'] },
  fc: { key: 'mountPattern', label: (v) => `${v}mm`, heroKeys: ['mountPattern', 'processor'] },
  esc: { key: 'ampRating', label: (v) => `${v}A ESCs`, heroKeys: ['ampRating', 'voltage'] },
  vtx: { key: 'videoSystem', label: (v) => v, heroKeys: ['videoSystem', 'power'] },
  camera: { key: 'videoSystem', label: (v) => v, heroKeys: ['videoSystem', 'sensorSize'] },
  goggles: { key: 'videoSystem', label: (v) => v, heroKeys: ['videoSystem', 'resolution'] },
  rx: { key: 'protocol', label: (v) => v, heroKeys: ['protocol', 'frequency'] },
  tx: { key: 'protocol', label: (v) => v, heroKeys: ['protocol', 'formFactor'] },
}

function getGroupValue(item) {
  const cfg = GROUP_CONFIG[props.category]
  if (!cfg) return 'Other'
  const val = item.specs?.[cfg.key]
  if (val == null) return 'Other'
  return String(Array.isArray(val) ? val[0] : val)
}

function getGroupLabel(val) {
  const cfg = GROUP_CONFIG[props.category]
  if (!cfg) return val
  return cfg.label(val)
}

const filtered = computed(() => {
  let items = props.items
  const q = search.value.toLowerCase()
  if (q) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      Object.values(item.specs || {}).some(v => String(v).toLowerCase().includes(q))
    )
  }
  if (activeGroup.value) {
    items = items.filter(item => getGroupLabel(getGroupValue(item)) === activeGroup.value)
  }
  return items
})

const sorted = computed(() => {
  const items = [...filtered.value]
  switch (sortMode.value) {
    case 'price-asc': return items.sort((a, b) => (a.cost || 0) - (b.cost || 0))
    case 'price-desc': return items.sort((a, b) => (b.cost || 0) - (a.cost || 0))
    case 'weight-asc': return items.sort((a, b) => (a.weight || 0) - (b.weight || 0))
    case 'name': return items.sort((a, b) => a.name.localeCompare(b.name))
    default: return items
  }
})

const groupLabels = computed(() => {
  const cfg = GROUP_CONFIG[props.category]
  if (!cfg) return []
  const labels = new Set()
  for (const item of props.items) {
    labels.add(getGroupLabel(getGroupValue(item)))
  }
  // Sort group labels sensibly
  return [...labels].sort((a, b) => {
    const na = parseFloat(a)
    const nb = parseFloat(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })
})

const groupedItems = computed(() => {
  if (activeGroup.value || groupLabels.value.length <= 1 || sortMode.value !== 'default') {
    return [{ label: null, items: sorted.value }]
  }
  const map = new Map()
  for (const item of sorted.value) {
    const label = getGroupLabel(getGroupValue(item))
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(item)
  }
  // Sort groups to match groupLabels order
  return groupLabels.value
    .filter(l => map.has(l))
    .map(l => ({ label: l, items: map.get(l) }))
})

const totalCount = computed(() => sorted.value.length)

function formatCost(cents) {
  return formatCurrency(cents)
}

function heroSpecs(item) {
  if (!item.specs) return {}
  const cfg = GROUP_CONFIG[props.category]
  const heroKeys = cfg?.heroKeys || []
  const entries = Object.entries(item.specs).filter(([k]) => heroKeys.includes(k)).slice(0, 3)
  return Object.fromEntries(entries.map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : v]))
}

function secondarySpecs(item) {
  if (!item.specs) return {}
  const cfg = GROUP_CONFIG[props.category]
  const heroKeys = cfg?.heroKeys || []
  const entries = Object.entries(item.specs).filter(([k]) => !heroKeys.includes(k)).slice(0, 2)
  return Object.fromEntries(entries.map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : v]))
}
</script>

<style scoped>
.selector-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.selector-controls {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.sort-select {
  width: 90px;
  padding: 0.35rem 0.5rem;
  font-family: 'Share Tech Mono', monospace;
  background: var(--qc-input-bg);
  cursor: pointer;
  flex-shrink: 0;
}
.sort-select option {
  background: var(--qc-select-bg);
  color: var(--qc-select-text);
}

.group-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.group-chip {
  padding: 2px 8px;
  font-size: 10px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-text-muted);
  background: transparent;
  border: 1px solid var(--qc-cyan-01);
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.3px;
}
.group-chip:hover {
  border-color: var(--qc-cyan-03);
  color: var(--qc-cyan);
}
.group-chip.active {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  color: var(--qc-cyan);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 4px;
  font-size: 10px;
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  color: var(--qc-cyan-05);
  letter-spacing: 1px;
  text-transform: uppercase;
  border-bottom: 1px solid var(--qc-cyan-008);
  margin-top: 4px;
}
.group-header:first-child {
  margin-top: 0;
}
.group-count {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: var(--qc-text-muted);
  font-weight: 400;
}

.selector-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-item.selected-item {
  border-left: 2px solid var(--qc-cyan);
}

.spec-tag {
  font-size: 10px;
  padding: 1px 6px;
  background: var(--qc-cyan-005);
  border: 1px solid var(--qc-cyan-008);
  color: var(--qc-text-muted);
  font-family: 'Share Tech Mono', monospace;
}
.spec-tag.hero {
  color: var(--qc-cyan-05);
  border-color: var(--qc-cyan-015);
  background: var(--qc-cyan-008);
}
</style>
