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
          @click="selectItem(item)"
          @mouseenter="onRowEnter(item, $event)"
          @mousemove="onRowMove($event)"
          @mouseleave="onRowLeave"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 min-w-0">
              <span class="text-tron-text-bright text-sm font-semibold font-[Rajdhani] truncate">{{ item.name }}</span>
              <span v-if="bundledBadge(item)" class="aio-badge" :title="bundledTitle(item)">{{ bundledBadge(item) }}</span>
              <span v-if="item.image" class="img-badge" :title="`Hover to preview ${item.name}`">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
                PHOTO
              </span>
            </span>
            <span class="text-tron-cyan text-xs font-mono shrink-0">{{ formatCost(item.cost) }}</span>
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

    <!-- Hover image preview (frames etc. that have an image) -->
    <Teleport to="body">
      <div v-if="previewItem" class="img-preview" :style="previewStyle">
        <img :src="imgSrc(previewItem.image)" :alt="previewItem.name" />
      </div>
    </Teleport>
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

const emit = defineEmits(['select'])

const search = ref('')
const sortMode = ref('default')
const activeGroup = ref(null)
const previewItem = ref(null)
const previewPos = ref({ x: 0, y: 0 })

// Reset search, group, and any open preview when items change (category switch)
watch(() => props.items, () => {
  search.value = ''
  activeGroup.value = null
  sortMode.value = 'default'
  previewItem.value = null
})

function selectItem(item) {
  previewItem.value = null
  emit('select', item)
}

// Hover image preview — only on hover-capable (desktop) pointers
const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
function onRowEnter(item, e) {
  if (canHover && item.image) {
    previewItem.value = item
    previewPos.value = { x: e.clientX, y: e.clientY }
  }
}
function onRowMove(e) { if (previewItem.value) previewPos.value = { x: e.clientX, y: e.clientY } }
function onRowLeave() { previewItem.value = null }

// Local public assets are stored without a leading slash; resolve against the
// app base (handles the /quadcalc/ GitHub Pages base). Full URLs pass through.
function imgSrc(path) {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : import.meta.env.BASE_URL + path.replace(/^\//, '')
}

// Position the preview to the left of the cursor (selector lives on the right),
// flipping to the right and clamping to the viewport when there's no room.
const previewStyle = computed(() => {
  const w = 260, h = 260, gap = 20
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  let left = previewPos.value.x - w - gap
  if (left < 8) left = Math.min(previewPos.value.x + gap, vw - w - 8)
  const top = Math.max(8, Math.min(previewPos.value.y - h / 2, vh - h - 8))
  return { left: `${left}px`, top: `${top}px`, width: `${w}px` }
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
      Object.values(item.specs || {}).some(v => String(v).toLowerCase().includes(q)) ||
      // Boolean feature flags (e.g. aio, aioVtx, aioRx) are searchable by key name
      Object.entries(item.specs || {}).some(([k, v]) => v === true && k.toLowerCase().includes(q))
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

// All-in-one badge: shows which parts are built into a board (FCs only).
// e.g. "AIO · ESC+VTX+RX". Returns null for non-bundled components.
function bundledParts(item) {
  const s = item.specs || {}
  const parts = []
  if (s.aio) parts.push('ESC')
  if (s.aioVtx) parts.push('VTX')
  if (s.aioRx) parts.push('RX')
  return parts
}
function bundledBadge(item) {
  const parts = bundledParts(item)
  return parts.length ? `AIO · ${parts.join('+')}` : null
}
function bundledTitle(item) {
  const parts = bundledParts(item)
  if (!parts.length) return ''
  const names = { ESC: 'ESC', VTX: 'video transmitter', RX: 'receiver' }
  return `All-in-one board — ${parts.map(p => names[p]).join(', ')} built in (those steps are auto-filled)`
}

function heroSpecs(item) {
  if (!item.specs) return {}
  const cfg = GROUP_CONFIG[props.category]
  const heroKeys = cfg?.heroKeys || []
  const entries = Object.entries(item.specs).filter(([k]) => heroKeys.includes(k)).slice(0, 3)
  return Object.fromEntries(entries.map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : v]))
}

// Spec keys to omit from the list tags, per category (not useful for browsing)
const HIDE_SPECS = { frame: ['material'] }

function secondarySpecs(item) {
  if (!item.specs) return {}
  const cfg = GROUP_CONFIG[props.category]
  const heroKeys = cfg?.heroKeys || []
  const hideKeys = HIDE_SPECS[props.category] || []
  const entries = Object.entries(item.specs)
    .filter(([k]) => !heroKeys.includes(k) && !hideKeys.includes(k))
    .slice(0, 2)
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

.aio-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
  padding: 1px 6px;
  color: var(--qc-green);
  background: var(--qc-green-008);
  border: 1px solid var(--qc-green-02);
  white-space: nowrap;
}

/* "Has photo" hint badge */
.img-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
  padding: 1px 5px 1px 4px;
  color: var(--qc-cyan);
  background: var(--qc-cyan-008);
  border: 1px solid var(--qc-cyan-03);
}
.img-badge svg { width: 11px; height: 11px; }
.preset-item:hover .img-badge {
  background: var(--qc-cyan-015);
  box-shadow: var(--qc-glow-cyan);
}

/* Floating hover preview (teleported to <body>) */
.img-preview {
  position: fixed;
  z-index: 60;
  pointer-events: none;
  padding: 5px;
  background: var(--qc-surface-solid);
  border: 1px solid var(--qc-cyan-03);
  box-shadow: var(--qc-glow-cyan), 0 6px 28px rgba(0, 0, 0, 0.55);
}
.img-preview img {
  display: block;
  width: 100%;
  height: auto;
}
</style>
