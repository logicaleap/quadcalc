<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <!-- Tab buttons -->
            <div class="flex gap-4">
              <button
                class="text-sm font-bold tracking-wider uppercase pb-1 border-b-2 transition-colors"
                :class="activeTab === 'import'
                  ? 'text-tron-cyan border-tron-cyan'
                  : 'text-tron-text/40 border-transparent hover:text-tron-text/60'"
                @click="activeTab = 'import'"
              >IMPORT</button>
              <button
                class="text-sm font-bold tracking-wider uppercase pb-1 border-b-2 transition-colors"
                :class="activeTab === 'manage'
                  ? 'text-tron-cyan border-tron-cyan'
                  : 'text-tron-text/40 border-transparent hover:text-tron-text/60'"
                @click="activeTab = 'manage'"
              >MY COMPONENTS <span v-if="totalCustomCount" class="text-xs">({{ totalCustomCount }})</span></button>
            </div>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <!-- ==================== IMPORT TAB ==================== -->
          <div v-if="activeTab === 'import'">
            <p class="text-xs text-tron-text/60 mb-3 leading-relaxed">
              Paste a product URL (e.g. from GetFPV, RaceDayQuads, Amazon, BangGood) and the AI will
              scan the page, figure out what type of component it is, and extract all the specs for you.
              Requires an OpenRouter API key (set in Settings).
            </p>

            <!-- URL input -->
            <div class="mb-3">
              <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-1">Product URL</label>
              <input
                v-model="url"
                type="url"
                class="tron-input w-full text-sm"
                placeholder="https://www.getfpv.com/..."
              />
            </div>

            <!-- OR paste text -->
            <div class="mb-3">
              <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-1">
                Or paste product description / specs
              </label>
              <textarea
                v-model="pastedText"
                class="tron-input w-full text-sm h-24 resize-none"
                placeholder="Paste product name, specs, price, weight, etc..."
              ></textarea>
            </div>

            <button
              class="tron-btn w-full text-sm mb-3"
              :class="{ 'opacity-50 cursor-not-allowed': loading || (!url.trim() && !pastedText.trim()) }"
              :disabled="loading || (!url.trim() && !pastedText.trim())"
              @click="handleScan"
            >
              {{ loading ? 'SCANNING...' : 'SCAN WITH AI' }}
            </button>

            <!-- Error -->
            <div v-if="error" class="text-xs text-tron-red mb-3 p-2 border border-tron-red/20 bg-tron-red/5">
              {{ error }}
            </div>

            <!-- Result preview -->
            <div v-if="result" class="mb-3 animate-fade-in">
              <div class="border-t border-tron-cyan/10 my-3"></div>
              <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-2">Detected Component</label>

              <div class="p-3 tron-border">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs px-2 py-0.5 bg-tron-cyan/10 border border-tron-cyan/20 text-tron-cyan font-mono uppercase">
                    {{ result.category }}
                  </span>
                  <span class="text-tron-text-bright font-semibold text-sm">{{ result.name }}</span>
                </div>
                <p class="text-xs text-tron-text/60 mb-2">{{ result.description }}</p>

                <div class="grid grid-cols-2 gap-1 mb-2">
                  <div class="text-xs">
                    <span class="text-tron-text/40">Cost:</span>
                    <span class="text-tron-cyan ml-1">{{ formatCost(result.cost) }}</span>
                  </div>
                  <div class="text-xs">
                    <span class="text-tron-text/40">Weight:</span>
                    <span class="text-tron-cyan ml-1">{{ result.weight ? result.weight + 'g' : '—' }}</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(val, key) in result.specs"
                    :key="key"
                    class="text-[10px] px-1.5 py-0.5 bg-tron-cyan/5 border border-tron-cyan/10 text-tron-cyan/70 font-mono"
                  >
                    {{ key }}: {{ Array.isArray(val) ? val.join('/') : val }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2 mt-3">
                <button class="tron-btn-success tron-btn text-xs flex-1" @click="handleAddToPresets">
                  ADD TO MY PRESETS
                </button>
                <button class="tron-btn text-xs flex-1" @click="handleAddToBuild">
                  ADD TO BUILD
                </button>
              </div>
            </div>
          </div>

          <!-- ==================== MY COMPONENTS TAB ==================== -->
          <div v-if="activeTab === 'manage'">
            <!-- Empty state -->
            <div v-if="totalCustomCount === 0" class="text-center py-8">
              <p class="text-tron-text/40 text-sm mb-2">No custom components yet.</p>
              <p class="text-tron-text/30 text-xs">Import a component from a URL or paste specs in the Import tab.</p>
            </div>

            <!-- Grouped by category -->
            <div v-else>
              <div v-for="cat in populatedCategories" :key="cat.key" class="mb-4">
                <h4 class="text-xs text-tron-text/50 uppercase tracking-wider font-mono mb-2">
                  {{ cat.label }} <span class="text-tron-text/30">({{ customPresets[cat.key].length }})</span>
                </h4>

                <div v-for="preset in customPresets[cat.key]" :key="preset.id" class="p-3 tron-border mb-2">
                  <!-- View mode -->
                  <div v-if="editingId !== preset.id">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-tron-text-bright font-semibold text-sm">{{ preset.name }}</span>
                      <div class="flex gap-2">
                        <button class="text-[10px] text-tron-cyan/60 hover:text-tron-cyan uppercase tracking-wider" @click="startEdit(cat.key, preset)">EDIT</button>
                        <button
                          class="text-[10px] uppercase tracking-wider"
                          :class="deleteConfirmId === preset.id ? 'text-tron-red' : 'text-tron-red/40 hover:text-tron-red/70'"
                          @click="handleDelete(cat.key, preset.id)"
                        >{{ deleteConfirmId === preset.id ? 'CONFIRM?' : 'DEL' }}</button>
                      </div>
                    </div>
                    <div class="flex gap-3 text-xs mb-1">
                      <span><span class="text-tron-text/40">Cost:</span> <span class="text-tron-cyan">{{ formatCost(preset.cost) }}</span></span>
                      <span><span class="text-tron-text/40">Weight:</span> <span class="text-tron-cyan">{{ preset.weight ? preset.weight + 'g' : '—' }}</span></span>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="(val, key) in limitSpecs(preset.specs)"
                        :key="key"
                        class="text-[10px] px-1.5 py-0.5 bg-tron-cyan/5 border border-tron-cyan/10 text-tron-cyan/70 font-mono"
                      >{{ key }}: {{ Array.isArray(val) ? val.join('/') : val }}</span>
                    </div>
                  </div>

                  <!-- Edit mode -->
                  <div v-else class="space-y-2">
                    <div>
                      <label class="text-[10px] text-tron-text/40 uppercase tracking-wider font-mono">Name</label>
                      <input v-model="editForm.name" class="tron-input w-full text-xs" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-tron-text/40 uppercase tracking-wider font-mono">Cost ($)</label>
                        <input v-model="editForm.costDollars" type="number" step="0.01" min="0" class="tron-input w-full text-xs" />
                      </div>
                      <div>
                        <label class="text-[10px] text-tron-text/40 uppercase tracking-wider font-mono">Weight (g)</label>
                        <input v-model.number="editForm.weight" type="number" min="0" class="tron-input w-full text-xs" />
                      </div>
                    </div>
                    <!-- Spec fields -->
                    <div v-for="(val, key) in editForm.specs" :key="key" class="flex gap-2 items-center">
                      <label class="text-[10px] text-tron-text/40 font-mono w-24 shrink-0 truncate">{{ key }}</label>
                      <input v-model="editForm.specs[key]" class="tron-input flex-1 text-xs" />
                    </div>
                    <div class="flex gap-2 pt-1">
                      <button class="tron-btn-success tron-btn text-[10px] flex-1" @click="saveEdit">SAVE</button>
                      <button class="tron-btn text-[10px] flex-1" @click="cancelEdit">CANCEL</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div v-if="statusMsg" class="text-xs text-tron-green text-center animate-fade-in mt-3">
            {{ statusMsg }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useStorage } from '../composables/useStorage.js'
import { formatCurrency, CATEGORIES } from '../utils/helpers.js'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const store = useBuildStore()
const { getSettings, getCustomPresets, saveCustomPreset, updateCustomPreset, deleteCustomPreset } = useStorage()

// Tab state (persists across modal open/close)
const activeTab = ref('import')

// Import tab state
const url = ref('')
const pastedText = ref('')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const statusMsg = ref('')

// Manage tab state
const customPresets = ref({})
const editingId = ref(null)
const editingCategory = ref(null)
const editForm = ref({ name: '', costDollars: 0, weight: 0, specs: {} })
const deleteConfirmId = ref(null)
let deleteConfirmTimer = null

const totalCustomCount = computed(() => {
  return Object.values(customPresets.value).reduce((sum, list) => sum + list.length, 0)
})

const populatedCategories = computed(() => {
  return CATEGORIES.filter(c => customPresets.value[c.key]?.length > 0)
})

// Refresh custom presets when modal opens
watch(() => props.show, (val) => {
  if (val) refreshCustomPresets()
})

function refreshCustomPresets() {
  customPresets.value = getCustomPresets()
}

function formatCost(cents) {
  return cents ? formatCurrency(cents) : '—'
}

function limitSpecs(specs) {
  if (!specs) return {}
  const entries = Object.entries(specs)
  if (entries.length <= 4) return specs
  return Object.fromEntries(entries.slice(0, 4))
}

// ---------- Edit ----------

function startEdit(category, preset) {
  editingId.value = preset.id
  editingCategory.value = category
  const specsCopy = {}
  if (preset.specs) {
    for (const [k, v] of Object.entries(preset.specs)) {
      specsCopy[k] = Array.isArray(v) ? v.join(', ') : String(v)
    }
  }
  editForm.value = {
    name: preset.name,
    costDollars: preset.cost ? (preset.cost / 100).toFixed(2) : '0.00',
    weight: preset.weight || 0,
    specs: specsCopy,
  }
}

function cancelEdit() {
  editingId.value = null
  editingCategory.value = null
}

function saveEdit() {
  const specs = {}
  for (const [k, v] of Object.entries(editForm.value.specs)) {
    const trimmed = String(v).trim()
    // Coerce numeric strings to Number
    const num = Number(trimmed)
    specs[k] = trimmed !== '' && !isNaN(num) && String(num) === trimmed ? num : trimmed
  }

  const costCents = Math.round(parseFloat(editForm.value.costDollars || 0) * 100)

  updateCustomPreset(editingCategory.value, editingId.value, {
    name: editForm.value.name,
    cost: costCents,
    weight: editForm.value.weight,
    specs,
  })

  editingId.value = null
  editingCategory.value = null
  refreshCustomPresets()
  statusMsg.value = 'Component updated'
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

// ---------- Delete ----------

function handleDelete(category, presetId) {
  if (deleteConfirmId.value === presetId) {
    // Second click — actually delete
    clearTimeout(deleteConfirmTimer)
    deleteCustomPreset(category, presetId)
    deleteConfirmId.value = null
    refreshCustomPresets()
    statusMsg.value = 'Component deleted'
    setTimeout(() => { statusMsg.value = '' }, 3000)
  } else {
    // First click — show confirm
    deleteConfirmId.value = presetId
    clearTimeout(deleteConfirmTimer)
    deleteConfirmTimer = setTimeout(() => { deleteConfirmId.value = null }, 3000)
  }
}

// ---------- Import (unchanged logic) ----------

async function fetchPageContent(pageUrl) {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pageUrl)}`
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) })
    if (res.ok) {
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const title = doc.querySelector('title')?.textContent || ''
      const meta = doc.querySelector('meta[name="description"]')?.content || ''
      const body = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 4000) || ''
      return `Page Title: ${title}\nMeta: ${meta}\nContent: ${body}`
    }
  } catch {
    // Proxy failed
  }
  return null
}

async function handleScan() {
  const settings = getSettings()
  if (!settings.apiKey) {
    error.value = 'Please set your OpenRouter API key in Settings first.'
    return
  }

  error.value = ''
  result.value = null
  statusMsg.value = ''
  loading.value = true

  const categoryKeys = CATEGORIES.map(c => c.key).join(', ')
  const categoryLabels = CATEGORIES.map(c => `${c.key} (${c.label})`).join(', ')

  let inputContent = ''
  if (url.value.trim()) {
    const pageContent = await fetchPageContent(url.value.trim())
    if (pageContent) {
      inputContent = `URL: ${url.value.trim()}\n\n${pageContent}`
    } else {
      inputContent = `URL: ${url.value.trim()}\n(Could not fetch page - please analyze based on the URL alone, or the user can paste text below)`
    }
  }
  if (pastedText.value.trim()) {
    inputContent += `\n\nUser-provided text:\n${pastedText.value.trim()}`
  }

  const systemPrompt = `You are a product data extraction AI for FPV drone components. Given a product URL or description, determine:
1. What category it belongs to: ${categoryLabels}
2. Extract: name, description, cost (in cents USD), weight (grams), and category-specific specs

You MUST respond with ONLY valid JSON, no markdown, no explanation. Use this exact schema:
{
  "category": "one of: ${categoryKeys}",
  "name": "Product Name",
  "description": "Short helpful description for beginners",
  "cost": 2999,
  "weight": 30,
  "specs": { ... category-specific key-value pairs ... }
}

Category-specific specs schemas:
- frame: { size: "3"|"5"|"7", mountPattern: "30.5x30.5"|"25.5x25.5", material: "Carbon Fiber", wheelbase: 225 }
- motors: { size: "2306", kv: 1900, shaftSize: "M5"|"M2", voltage: "4-6S", mountPattern: "16x16" }
- propellers: { size: "5", pitch: "3.1", blades: 3, shaftSize: "M5"|"M2", material: "PC" }
- battery: { voltage: "6S", capacity: 1300, cRating: 100, connector: "XT60"|"XT30", chemistry: "LiPo" }
- fc: { mcu: "STM32F405", firmware: "Betaflight", mountPattern: "30.5x30.5", voltage: "3-6S", uarts: 5, protocol: ["DShot600"] }
- esc: { current: 50, voltage: "3-6S", protocol: ["DShot600"], mountPattern: "30.5x30.5", blheli: "BLHeli_S" }
- vtx: { system: "Analog"|"DJI"|"HDZero"|"Walksnail", power: 800, voltage: "5-25V", connector: "MMCX", channels: 48 }
- camera: { system: "Analog"|"DJI"|"HDZero"|"Walksnail", resolution: "1200TVL", sensor: "1/3\\" CMOS", fov: 160, voltage: "5V" }
- rx: { protocol: "ELRS"|"Crossfire"|"FrSky"|"FlySky", frequency: "2.4GHz", antenna: "Wire", telemetry: true }
- tx: { protocol: "ELRS"|"Crossfire"|"FrSky"|"FlySky", frequency: "2.4GHz", channels: 16, display: "Color LCD", gimbal: "Hall" }
- goggles: { system: "Analog"|"DJI"|"HDZero"|"Walksnail", resolution: "1920x1080", fov: 46, dvr: true, diversity: true }
- vtxAntenna: { frequency: "5.8GHz", type: "RHCP", gain: "2.8dBi", connector: "SMA" }
- rxAntenna: { frequency: "2.4GHz", type: "Dipole", gain: "2dBi", connector: "UFL" }
- other: { } (any relevant specs)

If you can't determine the price, set cost to 0. If you can't determine weight, set weight to 0.
Only output the JSON object, nothing else.`

  try {
    const model = settings.model || 'google/gemini-2.0-flash-001'
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'QuadCalc FPV Builder',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: inputContent },
        ],
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`API error ${res.status}: ${errBody}`)
    }

    const data = await res.json()
    let reply = data.choices?.[0]?.message?.content || ''

    reply = reply.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()

    const parsed = JSON.parse(reply)

    if (!CATEGORIES.find(c => c.key === parsed.category)) {
      throw new Error(`Unknown category: ${parsed.category}`)
    }

    parsed.id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    result.value = parsed
  } catch (err) {
    if (err instanceof SyntaxError) {
      error.value = 'AI returned invalid data. Try pasting more specific product details.'
    } else {
      error.value = err.message
    }
  } finally {
    loading.value = false
  }
}

function handleAddToPresets() {
  if (!result.value) return
  saveCustomPreset(result.value.category, { ...result.value })
  refreshCustomPresets()
  statusMsg.value = `Added "${result.value.name}" to custom ${result.value.category} presets`
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

function handleAddToBuild() {
  if (!result.value) return
  const cat = result.value.category
  store.setComponent(cat, { ...result.value })
  store.selectedCategory = cat
  saveCustomPreset(cat, { ...result.value })
  refreshCustomPresets()
  statusMsg.value = `Added "${result.value.name}" to build as ${cat}`
  setTimeout(() => { statusMsg.value = '' }, 3000)
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
  width: 500px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
}

textarea.tron-input {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
