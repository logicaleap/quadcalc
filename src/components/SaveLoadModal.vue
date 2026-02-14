<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-tron-cyan text-sm font-bold tracking-wider uppercase">Save / Load Build</h3>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <!-- Save section -->
          <div class="mb-4">
            <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-1">Save Current Build</label>
            <div class="flex gap-2">
              <input
                v-model="saveName"
                class="tron-input flex-1 text-sm"
                placeholder="Build name..."
              />
              <button class="tron-btn-success tron-btn text-xs px-3" @click="handleSave">SAVE</button>
            </div>
          </div>

          <div class="border-t border-tron-cyan/10 my-3"></div>

          <!-- Export / Import -->
          <div class="grid grid-cols-2 gap-2 mb-4">
            <button class="tron-btn text-xs" @click="handleExport">EXPORT JSON</button>
            <button class="tron-btn text-xs" @click="handleExportCsv">EXPORT CSV</button>
            <button class="tron-btn text-xs" :class="{ 'tron-btn-success': shoppingCopied }" @click="handleCopyShoppingList">{{ shoppingCopied ? 'COPIED!' : 'COPY SHOPPING LIST' }}</button>
            <button class="tron-btn text-xs" :class="{ 'tron-btn-success': shareCopied }" @click="handleShareLink">{{ shareCopied ? 'LINK COPIED!' : 'SHARE LINK' }}</button>
            <label class="tron-btn text-xs text-center cursor-pointer col-span-2">
              IMPORT JSON
              <input type="file" accept=".json" class="hidden" @change="handleImport" />
            </label>
          </div>

          <div class="border-t border-tron-cyan/10 my-3"></div>

          <!-- Clear -->
          <div class="mb-4">
            <button class="tron-btn-danger tron-btn text-xs w-full" @click="handleClear">CLEAR CURRENT BUILD</button>
          </div>

          <div class="border-t border-tron-cyan/10 my-3"></div>

          <!-- Starter builds -->
          <div class="mb-4">
            <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-2">
              Starter Builds
            </label>
            <div class="grid grid-cols-1 gap-1.5">
              <button
                v-for="tpl in templates"
                :key="tpl.id"
                class="text-left p-2 tron-border hover:border-tron-cyan/30 transition-colors"
                @click="handleLoadTemplate(tpl)"
              >
                <div class="text-sm text-tron-cyan font-semibold">{{ tpl.name }}</div>
                <div class="text-[10px] text-tron-text/40 mt-0.5">{{ tpl.description }}</div>
              </button>
            </div>
          </div>

          <div class="border-t border-tron-cyan/10 my-3"></div>

          <!-- Saved builds list -->
          <div>
            <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-2">
              Saved Builds ({{ savedBuilds.length }})
            </label>

            <div v-if="savedBuilds.length === 0" class="text-xs text-tron-text/30 text-center py-4">
              No saved builds yet
            </div>

            <div class="max-h-48 overflow-y-auto space-y-1">
              <div
                v-for="build in savedBuilds"
                :key="build.id"
                class="flex items-center justify-between p-2 tron-border hover:border-tron-cyan/30 transition-colors"
              >
                <div>
                  <div class="text-sm text-tron-text-bright font-semibold">{{ build.name }}</div>
                  <div class="text-[10px] text-tron-text/30 font-mono">
                    {{ formatDate(build.timestamp) }}
                    · {{ countComponents(build) }} parts
                  </div>
                </div>
                <div class="flex gap-1">
                  <button class="tron-btn text-[10px] px-2 py-0.5" @click="handleLoad(build.id)">LOAD</button>
                  <button class="tron-btn-danger tron-btn text-[10px] px-2 py-0.5" @click="handleDelete(build.id)">DEL</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Status message -->
          <div v-if="statusMsg" class="mt-3 text-xs text-tron-green text-center animate-fade-in">
            {{ statusMsg }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useStorage } from '../composables/useStorage.js'
import { templates } from '../data/templates.js'
import { presets } from '../data/presets.js'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const store = useBuildStore()
const {
  savedBuilds, loadSavedBuilds,
  saveBuild, loadBuild, deleteBuild,
  exportBuildToFile, exportBuildToCsv, importBuildFromFile,
  copyShoppingList, copyShareUrl,
} = useStorage()

const saveName = ref('')
const statusMsg = ref('')
const shoppingCopied = ref(false)
const shareCopied = ref(false)

watch(() => props.show, (val) => {
  if (val) {
    loadSavedBuilds()
    saveName.value = store.buildName
    statusMsg.value = ''
  }
})

function handleLoadTemplate(tpl) {
  const comps = {}
  for (const [cat, presetId] of Object.entries(tpl.presetIds)) {
    const list = presets[cat] || []
    const found = list.find(p => p.id === presetId)
    if (found) comps[cat] = { ...found, category: cat }
  }
  store.loadBuild({ name: tpl.name, components: comps })
  statusMsg.value = `Loaded "${tpl.name}"`
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

function handleSave() {
  const name = saveName.value.trim() || 'Untitled Build'
  saveBuild(name)
  loadSavedBuilds()
  statusMsg.value = `Saved "${name}"`
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

function handleLoad(id) {
  loadBuild(id)
  statusMsg.value = 'Build loaded'
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

function handleDelete(id) {
  deleteBuild(id)
  loadSavedBuilds()
  statusMsg.value = 'Build deleted'
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

function handleClear() {
  store.clearAll()
  statusMsg.value = 'Build cleared'
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

async function handleShareLink() {
  try {
    await copyShareUrl()
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  } catch {
    statusMsg.value = 'Failed to copy link'
    setTimeout(() => { statusMsg.value = '' }, 2000)
  }
}

async function handleCopyShoppingList() {
  try {
    await copyShoppingList()
    shoppingCopied.value = true
    setTimeout(() => { shoppingCopied.value = false }, 2000)
  } catch {
    statusMsg.value = 'Failed to copy list'
    setTimeout(() => { statusMsg.value = '' }, 2000)
  }
}

function handleExport() {
  exportBuildToFile()
  statusMsg.value = 'Exported JSON'
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

function handleExportCsv() {
  exportBuildToCsv()
  statusMsg.value = 'Exported CSV'
  setTimeout(() => { statusMsg.value = '' }, 2000)
}

async function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    await importBuildFromFile(file)
    statusMsg.value = 'Build imported'
  } catch (err) {
    statusMsg.value = `Import failed: ${err.message}`
  }
  e.target.value = ''
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function countComponents(build) {
  if (!build.components) return 0
  return Object.values(build.components).filter(Boolean).length
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
  width: 440px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
