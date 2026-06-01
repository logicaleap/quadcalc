<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="credits-header">
            <div>
              <h2 class="credits-title glow-text-cyan">QUADCALC</h2>
              <span class="credits-sub">FPV BUILD PLANNER</span>
            </div>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <p class="credits-blurb">
            A free, browser-based planner for designing FPV drone builds — pick compatible
            parts, track cost, weight and thrust-to-weight, and export your parts list.
            Everything is stored locally in your browser.
          </p>

          <div class="credits-rows">
            <div class="credits-row">
              <span class="credits-label">Version</span>
              <span class="credits-value">v{{ appVersion }}</span>
            </div>
            <div class="credits-row">
              <span class="credits-label">Updated</span>
              <span class="credits-value">{{ updatedDate }}</span>
            </div>
            <div class="credits-row">
              <span class="credits-label">Created by</span>
              <a class="credits-link" href="https://asafshamir.com" target="_blank" rel="noopener">Asaf Shamir ↗</a>
            </div>
            <div class="credits-row">
              <span class="credits-label">Built with</span>
              <span class="credits-value">Vue 3 · Vite · Tailwind</span>
            </div>
          </div>

          <button class="tron-btn credits-feedback" @click="requestFeedback">
            💬 Send feedback
          </button>

          <p class="credits-disclaimer">
            Compatibility data is provided as guidance only. Always verify component
            specifications before purchasing.
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean })
const emit = defineEmits(['close', 'request-feedback'])

const appVersion = __APP_VERSION__

// __BUILD_DATE__ is an ISO "YYYY-MM-DD" string injected at build time.
// Parse the parts manually to avoid UTC→local timezone drift.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const [y, m, d] = __BUILD_DATE__.split('-')
const updatedDate = `${parseInt(d, 10)} ${MONTHS[parseInt(m, 10) - 1]} ${y}`

function requestFeedback() {
  emit('close')
  emit('request-feedback')
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
  width: 420px;
  max-width: 90vw;
  max-height: 88vh;
  overflow-y: auto;
  padding: 24px;
}

.credits-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--qc-cyan-01);
}
.credits-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--qc-cyan);
  letter-spacing: 3px;
  line-height: 1;
  margin: 0;
}
.credits-sub {
  display: block;
  margin-top: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: var(--qc-text-muted);
}

.credits-blurb {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  line-height: 1.55;
  color: var(--qc-text);
  margin: 0 0 16px;
}

.credits-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.credits-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--qc-cyan-005);
}
.credits-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--qc-cyan-05);
}
.credits-value {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--qc-text-bright);
}
.credits-link {
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--qc-cyan);
  text-decoration: none;
  border-bottom: 1px solid var(--qc-cyan-03);
}
.credits-link:hover {
  text-shadow: var(--qc-glow-text-cyan);
  border-bottom-color: var(--qc-cyan);
}

.credits-feedback {
  width: 100%;
  padding: 9px;
  font-size: 12px;
  margin-bottom: 14px;
}

.credits-disclaimer {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  line-height: 1.5;
  color: var(--qc-text-faint);
  margin: 0;
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
