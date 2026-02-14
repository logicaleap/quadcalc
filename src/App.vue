<template>
  <div class="app-root">
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
        <input
          v-model="store.buildName"
          class="tron-input text-xs w-40 text-center"
          placeholder="Build name..."
        />
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

    <!-- Credits -->
    <a href="mailto:contact@shamir.com.au" class="credits">Built by Asaf Shamir · contact@shamir.com.au</a>

    <!-- Modals -->
    <SaveLoadModal :show="showSaveLoad" @close="showSaveLoad = false" />
    <SettingsModal :show="showSettings" @close="showSettings = false" />
    <UrlImportModal :show="showUrlImport" @close="showUrlImport = false" />
    <HelpModal :show="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { useBuildStore } from './stores/buildStore.js'
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
const showSaveLoad = ref(false)
const showSettings = ref(false)
const showUrlImport = ref(false)
const showHelp = ref(false)

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
  background: rgba(10, 14, 20, 0.85);
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
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
  color: rgba(255, 200, 50, 0.4);
  letter-spacing: 0.5px;
  margin-top: 1px;
}

.credits {
  position: absolute;
  bottom: 8px;
  left: 12px;
  font-size: 11px;
  color: rgba(0, 240, 255, 0.3);
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
  z-index: 10;
  pointer-events: auto;
  text-decoration: none;
  transition: color 0.2s ease;
}
.credits:hover {
  color: rgba(0, 240, 255, 0.6);
}
</style>
