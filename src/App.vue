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
        <button class="tron-btn text-xs" @click="showSettings = true">SETTINGS</button>
        <button class="tron-btn text-xs" @click="showHelp = true">HELP</button>
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
      <a href="mailto:contact@shamir.com.au" class="credits">Built by Asaf Shamir · contact@shamir.com.au</a>
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
const { loadBuildFromUrl } = useStorage()
const { isDark, initTheme, toggleTheme } = useTheme()

onMounted(() => {
  initTheme()
  if (window.location.hash.includes('#build=')) {
    const loaded = loadBuildFromUrl(window.location.hash)
    if (loaded) history.replaceState(null, '', window.location.pathname)
  }
})

const showSaveLoad = ref(false)
const showSettings = ref(false)
const showUrlImport = ref(false)
const showHelp = ref(false)

const appVersion = __APP_VERSION__

const mq = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mq.matches)
function onMqChange(e) { isMobile.value = e.matches }
mq.addEventListener('change', onMqChange)
onUnmounted(() => mq.removeEventListener('change', onMqChange))

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
