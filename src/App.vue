<template>
  <div class="app-root" :class="{ mobile: isMobile }">
    <TronGrid />

    <!-- Top bar -->
    <header class="top-bar">
      <div class="flex items-center gap-3">
        <div>
          <h1 class="text-tron-cyan text-base font-bold tracking-widest glow-text-cyan">QUADCALC</h1>
          <span class="browser-storage-note">All data saved locally in your browser</span>
        </div>
        <span class="text-tron-text/20 text-xs font-mono hidden sm:inline">FPV BUILD PLANNER</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="theme-toggle tron-btn text-xs" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button class="tron-btn text-xs" @click="showUrlImport = true">IMPORT URL</button>
        <button class="tron-btn text-xs" @click="showSaveLoad = true">BUILDS</button>
        <button class="theme-toggle tron-btn text-xs" @click="showSettings = true" title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button class="theme-toggle tron-btn text-xs" @click="showHelp = true" title="Help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
        <div class="share-wrapper" ref="shareWrapperRef">
          <button
            class="theme-toggle tron-btn text-xs"
            :class="{ active: showShareMenu }"
            @click="showShareMenu = !showShareMenu"
            title="Export / Share"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showShareMenu" class="share-dropdown tron-panel">
              <button class="share-option" @click="handleShareLink">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>{{ shareFeedback || shareLabel }}</span>
              </button>
              <button class="share-option" @click="handleShoppingList">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                <span>{{ shoppingFeedback || 'SHOPPING LIST' }}</span>
              </button>
              <div class="share-divider"></div>
              <button class="share-option" @click="handleExportJson">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>EXPORT JSON</span>
              </button>
              <button class="share-option" @click="handleExportCsv">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>EXPORT CSV</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- Build Summary (top center) -->
    <BuildSummary />

    <!-- Main diagram area -->
    <main class="diagram-area">
      <QuadDiagram />
    </main>

    <!-- Component panel (right side) -->
    <ComponentPanel />

    <!-- Compatibility Alerts (bottom left) -->
    <CompatibilityAlerts />

    <!-- AI Chat (bottom right) -->
    <AiChat />

    <!-- Credits & Disclaimer -->
    <div class="bottom-info">
      <a href="https://asafshamir.com" target="_blank" rel="noopener" class="credits">Asaf Shamir</a>
      <span class="version-tag">v{{ appVersion }}</span>
      <span class="disclaimer">Compatibility data is provided as guidance only. Always verify component specifications before purchasing.</span>
    </div>

    <!-- Modals -->
    <SaveLoadModal :show="showSaveLoad" @close="showSaveLoad = false" />
    <SettingsModal :show="showSettings" @close="showSettings = false" />
    <UrlImportModal :show="showUrlImport" @close="showUrlImport = false" />
    <HelpModal :show="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup>
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { useBuildStore } from './stores/buildStore.js'
import { useStorage } from './composables/useStorage.js'
import { useTheme } from './composables/useTheme.js'
import TronGrid from './components/TronGrid.vue'
import QuadDiagram from './components/QuadDiagram.vue'
import ComponentPanel from './components/ComponentPanel.vue'
import BuildSummary from './components/BuildSummary.vue'
import CompatibilityAlerts from './components/CompatibilityAlerts.vue'
import AiChat from './components/AiChat.vue'
import SaveLoadModal from './components/SaveLoadModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import UrlImportModal from './components/UrlImportModal.vue'
import HelpModal from './components/HelpModal.vue'

const store = useBuildStore()
const { loadBuildFromUrl, generateShareUrl, copyShareUrl, copyShoppingList, exportBuildToFile, exportBuildToCsv } = useStorage()
const { isDark, initTheme, toggleTheme } = useTheme()

onMounted(() => {
  initTheme()
  if (window.location.hash.includes('#build=')) {
    const loaded = loadBuildFromUrl(window.location.hash)
    if (loaded) history.replaceState(null, '', window.location.pathname)
  }
  document.addEventListener('click', closeShareOnClickOutside, true)
})

const showSaveLoad = ref(false)
const showSettings = ref(false)
const showUrlImport = ref(false)
const showHelp = ref(false)

// Share dropdown
const showShareMenu = ref(false)
const shareWrapperRef = ref(null)
const shareFeedback = ref('')
const shoppingFeedback = ref('')
const shareLabel = navigator.share ? 'SHARE' : 'COPY LINK'

function closeShareOnClickOutside(e) {
  if (showShareMenu.value && shareWrapperRef.value && !shareWrapperRef.value.contains(e.target)) {
    showShareMenu.value = false
  }
}

async function handleShareLink() {
  const url = generateShareUrl()
  if (navigator.share) {
    showShareMenu.value = false
    try {
      await navigator.share({ title: store.buildName, url })
    } catch {
      // User cancelled the share sheet — no action needed
    }
  } else {
    await navigator.clipboard.writeText(url)
    shareFeedback.value = 'COPIED!'
    setTimeout(() => { shareFeedback.value = ''; showShareMenu.value = false }, 1200)
  }
}

async function handleShoppingList() {
  await copyShoppingList()
  shoppingFeedback.value = 'COPIED!'
  setTimeout(() => { shoppingFeedback.value = ''; showShareMenu.value = false }, 1200)
}

function handleExportJson() {
  exportBuildToFile()
  showShareMenu.value = false
}

function handleExportCsv() {
  exportBuildToCsv()
  showShareMenu.value = false
}

const appVersion = __APP_VERSION__

const mq = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mq.matches)
function onMqChange(e) { isMobile.value = e.matches }
mq.addEventListener('change', onMqChange)
onUnmounted(() => {
  mq.removeEventListener('change', onMqChange)
  document.removeEventListener('click', closeShareOnClickOutside, true)
})

provide('isMobile', isMobile)
provide('openSettings', () => { showSettings.value = true })
</script>

<style scoped>
.app-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--qc-surface);
  border-bottom: 1px solid var(--qc-cyan-01);
  backdrop-filter: blur(8px);
}

.diagram-area {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.browser-storage-note {
  display: block;
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-note-color);
  letter-spacing: 0.5px;
  margin-top: 1px;
}

.theme-toggle {
  padding: 0.4rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-info {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  pointer-events: none;
}
.credits {
  font-size: 11px;
  color: var(--qc-cyan-03);
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
  pointer-events: auto;
  text-decoration: none;
  transition: color 0.2s ease;
}
.credits:hover {
  color: var(--qc-cyan-05);
}
.version-tag {
  font-size: 9px;
  color: var(--qc-text-faint);
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
  pointer-events: none;
}
.disclaimer {
  font-size: 9px;
  color: var(--qc-text-faint);
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.3px;
  pointer-events: none;
}

/* Share button & dropdown */
.share-wrapper {
  position: relative;
}
.share-wrapper .active {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
}
.share-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  min-width: 160px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.share-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  color: var(--color-tron-text-bright);
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-align: left;
}
.share-option:hover {
  background: var(--qc-cyan-015);
  color: var(--qc-cyan);
}
.share-option svg {
  flex-shrink: 0;
  opacity: 0.6;
}
.share-option:hover svg {
  opacity: 1;
}
.share-divider {
  height: 1px;
  background: var(--qc-cyan-01);
  margin: 2px 6px;
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: all 0.15s ease-out;
}
.dropdown-leave-active {
  transition: all 0.1s ease-in;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Mobile layout */
.app-root.mobile {
  overflow-y: auto;
  overflow-x: hidden;
  height: auto;
  min-height: 100vh;
}
.app-root.mobile .top-bar {
  position: sticky;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
}
.app-root.mobile .diagram-area {
  position: relative;
  top: auto;
  min-height: 60vh;
  padding: 10px;
}
.app-root.mobile .bottom-info {
  position: relative;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  padding: 12px;
  bottom: auto;
  left: auto;
  right: auto;
}
</style>
