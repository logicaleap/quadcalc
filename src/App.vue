<template>
  <div class="app-root" :class="{ mobile: isMobile }">
    <TronGrid />

    <!-- Top bar -->
    <header class="top-bar">
      <div class="title-block flex items-center gap-3">
        <div
          class="logo-btn"
          role="button"
          tabindex="0"
          title="About QuadCalc"
          @click="showCredits = true"
          @keydown.enter="showCredits = true"
          @keydown.space.prevent="showCredits = true"
        >
          <h1 class="text-tron-cyan text-base font-bold tracking-widest glow-text-cyan">QUADCALC</h1>
          <span class="browser-storage-note">FPV BUILD PLANNER</span>
        </div>
        <span class="text-tron-text/20 text-xs font-mono hidden sm:inline">All data saved locally in your browser</span>
      </div>
      <div class="flex items-center gap-2 top-actions">
        <div class="utility-icons">
          <button class="btn-theme theme-toggle tron-btn text-xs" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
          <button class="btn-settings theme-toggle tron-btn text-xs" @click="showSettings = true" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button class="btn-help theme-toggle tron-btn text-xs" @click="showHelp = true" title="Help">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
          <button class="btn-feedback theme-toggle tron-btn text-xs" @click="showFeedback = true" title="Send feedback">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
        <div class="primary-actions">
          <button class="btn-guided tron-btn text-xs guided-btn" @click="showWizard = true" title="Step-by-step guided build for beginners">GUIDED BUILD</button>
          <button class="btn-import tron-btn text-xs" @click="showUrlImport = true">IMPORT URL</button>
          <button class="btn-builds tron-btn text-xs" @click="showSaveLoad = true">BUILDS</button>
          <button
            class="tron-btn text-xs export-btn"
            :class="{ active: showExport }"
            @click="showExport = true"
            title="Export build & parts list"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span>EXPORT</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Build Summary (top center) -->
    <BuildSummary @request-feedback="showFeedback = true" />

    <!-- Main diagram area -->
    <main class="diagram-area">
      <QuadDiagram />

      <!-- Empty-state onboarding overlay -->
      <Transition name="onboarding-fade">
        <div v-if="store.filledCount === 0 && !store.selectedCategory && !showTour && !dismissedOnboarding" class="onboarding-overlay">
          <div class="onboarding-card tron-panel">
            <div class="onboarding-header">
              <h2 class="onboarding-title">BUILD YOUR QUAD</h2>
              <p class="onboarding-subtitle">Pick a starting point</p>
            </div>
            <button class="onboarding-guided-btn" @click="startGuided">
              <span class="guided-label">⭐ Guided Build</span>
              <span class="guided-hint">New to FPV? We'll walk you through each part, step by step</span>
            </button>
            <div class="onboarding-action-row">
              <button class="onboarding-scratch-btn" @click="startFromScratch">
                <span class="scratch-label">Start from Scratch</span>
                <span class="scratch-hint">Pick each component yourself</span>
              </button>
              <button class="onboarding-tour-btn" @click="showTour = true">
                <span class="scratch-label">Take a Tour</span>
                <span class="scratch-hint">Learn how QuadCalc works</span>
              </button>
            </div>
            <div class="onboarding-divider"></div>
            <div class="onboarding-starter-section">
              <span class="onboarding-or-label">OR LOAD A STARTER BUILD</span>
              <div class="onboarding-starter-grid">
                <button
                  v-for="tpl in starterTemplates"
                  :key="tpl.id"
                  class="onboarding-starter-btn"
                  @click="loadStarterBuild(tpl)"
                >
                  <span class="starter-icon">{{ tpl.icon }}</span>
                  <span class="starter-name">{{ tpl.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
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
    <FeedbackModal :show="showFeedback" @close="showFeedback = false" />
    <ExportModal :show="showExport" @close="showExport = false" />
    <BuildWizard :show="showWizard" @close="showWizard = false" />
    <CreditsModal :show="showCredits" @close="showCredits = false" @request-feedback="showFeedback = true" />

    <!-- Guided Tour -->
    <GuidedTour :active="showTour" @end="showTour = false" />
  </div>
</template>

<script setup>
import { ref, provide, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBuildStore } from './stores/buildStore.js'
import { useStorage } from './composables/useStorage.js'
import { useTheme } from './composables/useTheme.js'
import { templates } from './data/templates.js'
import { presets } from './data/presets.js'
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
import FeedbackModal from './components/FeedbackModal.vue'
import ExportModal from './components/ExportModal.vue'
import BuildWizard from './components/BuildWizard.vue'
import CreditsModal from './components/CreditsModal.vue'
import GuidedTour from './components/GuidedTour.vue'

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
const showFeedback = ref(false)
const showExport = ref(false)
const showWizard = ref(false)
const showCredits = ref(false)
const showTour = ref(false)

const appVersion = __APP_VERSION__

// Onboarding — starter build icons and loading
const starterIcons = { 'tpl-budget-5': '5"', 'tpl-premium-5': 'HD', 'tpl-cinewhoop-3': '3"', 'tpl-longrange-7': '7"', 'tpl-tinywhoop': 'TW' }
const starterTemplates = templates.map(t => ({ ...t, icon: starterIcons[t.id] || '?' }))

const dismissedOnboarding = ref(false)

function startFromScratch() {
  dismissedOnboarding.value = true
}

function startGuided() {
  dismissedOnboarding.value = true
  showWizard.value = true
}

function loadStarterBuild(tpl) {
  const comps = {}
  for (const [cat, presetId] of Object.entries(tpl.presetIds)) {
    const list = presets[cat] || []
    const found = list.find(p => p.id === presetId)
    if (found) comps[cat] = { ...found, category: cat }
  }
  store.loadBuild({ name: tpl.name, components: comps })
}

// Dynamic document title
watch(() => store.buildName, (name) => {
  document.title = name && name !== 'Untitled Build'
    ? `${name} — QuadCalc`
    : 'QuadCalc — FPV Drone Build Planner'
}, { immediate: true })

const mq = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mq.matches)
function onMqChange(e) { isMobile.value = e.matches }
mq.addEventListener('change', onMqChange)
onUnmounted(() => {
  mq.removeEventListener('change', onMqChange)
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

.logo-btn {
  cursor: pointer;
  outline: none;
  transition: filter 0.2s, opacity 0.2s;
}
.logo-btn:hover,
.logo-btn:focus-visible {
  filter: brightness(1.15);
}
.logo-btn:focus-visible {
  outline: 1px solid var(--qc-cyan-03);
  outline-offset: 3px;
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

/* Export button */
.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}
.export-btn.active {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
}

/* Top-bar action grouping.
   On desktop the two groups collapse (display:contents) so all buttons sit in
   one row; `order` reproduces the original interleaved sequence exactly. */
.utility-icons,
.primary-actions {
  display: contents;
}
.btn-theme { order: 0; }
.btn-builds { order: 1; }
.btn-guided { order: 2; }
.btn-import { order: 3; }
.btn-settings { order: 4; }
.btn-help { order: 5; }
.btn-feedback { order: 6; }
.export-btn { order: 7; }

/* Guided Build — beginner CTA, subtly accented */
.guided-btn {
  border-color: var(--qc-cyan-03);
  color: var(--qc-cyan);
}
.guided-btn:hover {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
}

/* Onboarding overlay */
.onboarding-overlay {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12;
  pointer-events: auto;
}
.onboarding-card {
  padding: 16px 24px;
  text-align: center;
  max-width: 520px;
  border: 1px solid var(--qc-cyan-03);
  box-shadow: var(--qc-glow-cyan), 0 4px 24px rgba(0,0,0,0.3);
}
.onboarding-header {
  margin-bottom: 12px;
}
.onboarding-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--qc-cyan);
  letter-spacing: 2px;
  text-shadow: var(--qc-glow-text-cyan);
  margin: 0 0 6px 0;
}
.onboarding-subtitle {
  font-size: 12px;
  color: var(--qc-text);
  font-family: 'Rajdhani', sans-serif;
  margin: 0;
  opacity: 0.7;
}
.onboarding-guided-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: var(--qc-cyan-015);
  border: 1px solid var(--qc-cyan);
  color: var(--qc-cyan);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--qc-glow-cyan);
}
.onboarding-guided-btn:hover {
  background: var(--qc-cyan-02);
  transform: translateY(-1px);
  box-shadow: var(--qc-glow-cyan-strong);
}
.guided-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
}
.guided-hint {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  color: var(--qc-text);
  opacity: 0.7;
}

.onboarding-action-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.onboarding-scratch-btn,
.onboarding-tour-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  padding: 10px 16px;
  background: var(--qc-cyan-008);
  border: 1px solid var(--qc-cyan-03);
  color: var(--qc-cyan);
  cursor: pointer;
  transition: all 0.2s;
}
.onboarding-scratch-btn:hover,
.onboarding-tour-btn:hover {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
}
.scratch-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}
.scratch-hint {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  color: var(--qc-text);
  opacity: 0.6;
}

.onboarding-divider {
  height: 1px;
  background: var(--qc-cyan-015);
  margin: 0 0 12px 0;
}
.onboarding-or-label {
  display: block;
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-text-muted);
  letter-spacing: 1.5px;
  margin-bottom: 10px;
}
.onboarding-starter-grid {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.onboarding-starter-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--qc-cyan-005);
  border: 1px solid var(--qc-cyan-02);
  color: var(--qc-cyan);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 72px;
}
.onboarding-starter-btn:hover {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
  transform: translateY(-1px);
}
.starter-icon {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}
.starter-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--qc-text);
}

/* Onboarding fade transition */
.onboarding-fade-enter-active {
  transition: all 0.4s ease-out;
}
.onboarding-fade-leave-active {
  transition: all 0.25s ease-in;
}
.onboarding-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.onboarding-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* Mobile layout */
.app-root.mobile {
  overflow: hidden;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
}
.app-root.mobile .top-bar {
  position: sticky;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  padding: 8px 12px;
  order: 1;
}
/* Row 1: title (left) + utility icons (right). Row 2: primary actions, centered.
   top-actions collapses so its two groups become direct children of top-bar. */
.app-root.mobile .top-actions {
  display: contents;
}
.app-root.mobile .title-block {
  order: 1;
  flex: 1 1 auto;
}
.app-root.mobile .utility-icons {
  display: flex;
  gap: 6px;
  order: 2;
  justify-content: flex-end;
}
.app-root.mobile .primary-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  order: 3;
  flex-basis: 100%;
  justify-content: center;
  overflow-x: auto;
}
/* Tighten the primary buttons so all four fit one line on a phone */
.app-root.mobile .primary-actions .tron-btn {
  padding: 0.4rem 0.55rem;
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}
.app-root.mobile .primary-actions .export-btn { gap: 4px; }
.app-root.mobile .build-summary {
  order: 2;
}
.app-root.mobile .ai-chat-wrapper {
  order: 2;
}
.app-root.mobile .diagram-area {
  position: relative;
  top: auto;
  flex: 1;
  min-height: 0;
  /* Reserve room at the bottom for the alerts/wiring overlay so the diagram
     centres in the visible space above it instead of hiding behind it. */
  padding: 10px 10px 22vh;
  order: 3;
}
.app-root.mobile .onboarding-overlay {
  position: fixed;
  inset: 0;
  bottom: auto;
  left: 0;
  right: 0;
  top: 0;
  transform: none;
  width: 100%;
  height: 100%;
  padding: 16px 12px;
  background: var(--qc-overlay);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.app-root.mobile .onboarding-card {
  max-width: 100%;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.app-root.mobile .bottom-info {
  display: none;
}
</style>
