<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-title">
              <h3 class="export-title">EXPORT BUILD</h3>
              <span class="export-summary">{{ summaryLine }}</span>
            </div>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <!-- Share link row (always available) -->
          <div class="share-row">
            <span class="share-row-label">SHARE LINK</span>
            <span class="share-row-hint">Re-opens this exact build</span>
            <button class="tron-btn text-xs share-row-btn" @click="doShareLink">
              {{ shareFeedback || shareLabel }}
            </button>
          </div>

          <!-- Format tabs -->
          <div class="tab-row">
            <button
              v-for="t in tabs"
              :key="t.key"
              class="tab-btn"
              :class="{ active: activeTab === t.key }"
              @click="activeTab = t.key"
            >{{ t.label }}</button>
          </div>

          <!-- Empty state -->
          <div v-if="rows.length === 0" class="empty-state">
            <div class="text-tron-text/40 text-sm">No parts in this build yet.</div>
            <div class="text-tron-text/20 text-xs mt-1">Add components to export a parts list.</div>
          </div>

          <template v-else>
            <!-- Parts list (rich, human view with buy links) -->
            <div v-if="activeTab === 'parts'" class="parts-body">
              <div class="parts-table">
                <div class="parts-head">
                  <span>PART</span>
                  <span class="ta-center">QTY</span>
                  <span class="ta-right">PRICE</span>
                  <span></span>
                </div>
                <div v-for="row in rows" :key="row.key" class="parts-row">
                  <span class="parts-name">
                    <span class="dot" :style="{ background: row.color }"></span>
                    <span class="parts-cat">{{ row.label }}</span>
                    <span class="parts-comp">{{ row.comp.name }}</span>
                  </span>
                  <span class="ta-center parts-qty">{{ row.qtyNote }}</span>
                  <span class="ta-right parts-price">{{ row.priceStr }}</span>
                  <a
                    class="find-link"
                    :href="row.url"
                    target="_blank"
                    rel="noopener"
                    title="Search for this part"
                  >FIND ↗</a>
                </div>
                <div class="parts-row parts-total">
                  <span>TOTAL</span>
                  <span></span>
                  <span class="ta-right">{{ totalCost }}</span>
                  <span></span>
                </div>
              </div>
              <p class="parts-foot">
                Flying weight {{ totalWeight }} (excludes goggles &amp; TX). FIND links open a web search — no affiliate, no tracking.
              </p>
            </div>

            <!-- Text formats -->
            <div v-else class="text-body">
              <pre class="code-preview">{{ activePreview }}</pre>
            </div>

            <!-- Action footer -->
            <div class="action-row">
              <button class="tron-btn action-btn" @click="doCopy">
                {{ copyFeedback || (activeTab === 'parts' ? 'COPY AS MARKDOWN' : 'COPY') }}
              </button>
              <button class="tron-btn action-btn" @click="doDownload">
                DOWNLOAD {{ downloadExt }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useStorage } from '../composables/useStorage.js'
import { CATEGORIES, CATEGORY_COLORS, formatCurrency, formatWeight } from '../utils/helpers.js'
import { quantityFor, partSearchUrl } from '../composables/useStorage.js'

const props = defineProps({ show: Boolean })
defineEmits(['close'])

const store = useBuildStore()
const {
  generateShareUrl,
  buildShoppingMarkdown,
  buildCsvString,
  buildJsonString,
  exportShoppingListToFile,
  exportBuildToCsv,
  exportBuildToFile,
} = useStorage()

const tabs = [
  { key: 'parts', label: 'PARTS LIST' },
  { key: 'markdown', label: 'MARKDOWN' },
  { key: 'csv', label: 'CSV' },
  { key: 'json', label: 'JSON' },
]
const activeTab = ref('parts')

watch(() => props.show, (val) => {
  if (val) { activeTab.value = 'parts'; copyFeedback.value = ''; shareFeedback.value = '' }
})

const rows = computed(() =>
  CATEGORIES.map(cat => {
    const comp = store.components[cat.key]
    if (!comp) return null
    const qty = quantityFor(comp.category)
    const price = comp.cost != null ? (qty.multiplyPrice ? comp.cost * qty.count : comp.cost) : null
    return {
      key: cat.key,
      label: cat.label,
      comp,
      color: CATEGORY_COLORS[cat.key] || '#8d6e63',
      qtyNote: qty.note || '1',
      priceStr: price != null ? formatCurrency(price) : '—',
      url: partSearchUrl(comp.name),
    }
  }).filter(Boolean)
)

const totalCost = computed(() => formatCurrency(store.totalCost))
const totalWeight = computed(() => formatWeight(store.totalWeight))

const summaryLine = computed(() =>
  `${store.filledCount}/${CATEGORIES.length} parts · ${totalCost.value} · ${totalWeight.value}`
)

// Memoize the heavier string builds to the active tab
const activePreview = computed(() => {
  if (activeTab.value === 'markdown') return buildShoppingMarkdown()
  if (activeTab.value === 'csv') return buildCsvString()
  if (activeTab.value === 'json') return buildJsonString()
  return ''
})

const downloadExt = computed(() => {
  if (activeTab.value === 'csv') return 'CSV'
  if (activeTab.value === 'json') return 'JSON'
  return 'MARKDOWN'
})

// --- Copy ---
const copyFeedback = ref('')
async function doCopy() {
  let text
  if (activeTab.value === 'parts' || activeTab.value === 'markdown') text = buildShoppingMarkdown()
  else if (activeTab.value === 'csv') text = buildCsvString()
  else text = buildJsonString()
  try {
    await navigator.clipboard.writeText(text)
    copyFeedback.value = 'COPIED!'
    setTimeout(() => { copyFeedback.value = '' }, 1400)
  } catch {
    copyFeedback.value = 'COPY FAILED'
    setTimeout(() => { copyFeedback.value = '' }, 1400)
  }
}

// --- Download ---
function doDownload() {
  if (activeTab.value === 'csv') exportBuildToCsv()
  else if (activeTab.value === 'json') exportBuildToFile()
  else exportShoppingListToFile()
}

// --- Share link ---
const shareFeedback = ref('')
const shareLabel = navigator.share ? 'SHARE' : 'COPY LINK'
async function doShareLink() {
  const url = generateShareUrl()
  if (navigator.share) {
    try { await navigator.share({ title: store.buildName, url }) } catch { /* cancelled */ }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    shareFeedback.value = 'COPIED!'
    setTimeout(() => { shareFeedback.value = '' }, 1400)
  } catch {
    shareFeedback.value = 'FAILED'
    setTimeout(() => { shareFeedback.value = '' }, 1400)
  }
}
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
  width: 560px;
  max-width: 92vw;
  max-height: 88vh;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--qc-cyan-01);
}
.header-title { display: flex; flex-direction: column; gap: 3px; }
.export-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--qc-cyan);
  letter-spacing: 2px;
  text-shadow: var(--qc-glow-text-cyan);
  margin: 0;
}
.export-summary {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: var(--qc-text-muted);
  letter-spacing: 0.5px;
}

/* Share link row */
.share-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 14px;
  background: var(--qc-cyan-005);
  border: 1px solid var(--qc-cyan-01);
}
.share-row-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--qc-cyan-05);
}
.share-row-hint {
  flex: 1;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: var(--qc-text-muted);
}
.share-row-btn { min-width: 92px; }

/* Tabs */
.tab-row { display: flex; gap: 0; border-bottom: 1px solid var(--qc-cyan-01); margin-bottom: 14px; }
.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--qc-text-muted);
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  padding: 4px 14px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { color: var(--qc-cyan-05); }
.tab-btn.active {
  color: var(--qc-cyan);
  border-bottom-color: var(--qc-cyan);
  text-shadow: var(--qc-glow-text-cyan);
}

/* Parts list */
.parts-table { font-family: 'Rajdhani', sans-serif; }
.parts-head {
  display: grid;
  grid-template-columns: 1fr 64px 72px 56px;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--qc-cyan-02);
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--qc-text-muted);
}
.parts-row {
  display: grid;
  grid-template-columns: 1fr 64px 72px 56px;
  gap: 8px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid var(--qc-cyan-005);
}
.parts-name { display: flex; align-items: center; gap: 7px; min-width: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.parts-cat {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: var(--qc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 78px;
  flex-shrink: 0;
}
.parts-comp {
  font-size: 13px;
  font-weight: 600;
  color: var(--qc-text-bright);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.parts-qty {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: var(--qc-text-muted);
}
.parts-price {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--qc-text);
}
.find-link {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--qc-cyan-05);
  text-decoration: none;
  text-align: right;
  white-space: nowrap;
  transition: color 0.15s, text-shadow 0.15s;
}
.find-link:hover { color: var(--qc-cyan); text-shadow: var(--qc-glow-text-cyan); }
.parts-total {
  border-top: 1px solid var(--qc-cyan-02);
  border-bottom: none;
  margin-top: 2px;
  padding-top: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--qc-text-bright);
  letter-spacing: 1px;
}
.parts-foot {
  margin: 10px 0 0;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  line-height: 1.5;
  color: var(--qc-text-muted);
}

/* Text formats */
.code-preview {
  margin: 0;
  padding: 12px;
  max-height: 320px;
  overflow: auto;
  background: var(--qc-cyan-005);
  border: 1px solid var(--qc-cyan-01);
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--qc-text);
  white-space: pre;
  tab-size: 2;
}

.empty-state { text-align: center; padding: 32px 16px; }

.action-row { display: flex; gap: 8px; margin-top: 16px; }
.action-btn { flex: 1; padding: 8px; font-size: 11px; }

.ta-right { text-align: right; }
.ta-center { text-align: center; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
  }
  .parts-cat { display: none; }
  .parts-head, .parts-row { grid-template-columns: 1fr 50px 64px 48px; }
}
</style>
