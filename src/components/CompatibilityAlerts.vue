<template>
  <div v-if="alerts.length > 0" class="compat-alerts">
    <div class="alerts-header" @click="expanded = !expanded">
      <div class="flex items-center gap-2">
        <span v-if="errors.length" class="text-tron-red font-bold text-xs">{{ errors.length }} ERROR{{ errors.length > 1 ? 'S' : '' }}</span>
        <span v-if="warnings.length" class="text-tron-yellow font-bold text-xs">{{ warnings.length }} WARN</span>
        <span v-if="infos.length" class="text-tron-cyan/60 font-bold text-xs">{{ infos.length }} INFO</span>
      </div>
      <span class="text-tron-cyan/40 text-xs">{{ expanded ? '▼' : '▶' }}</span>
    </div>

    <Transition name="expand">
      <div v-if="expanded" class="alerts-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert-item"
          :class="{
            'alert-error': alert.severity === 'error',
            'alert-warning': alert.severity === 'warning',
            'alert-info': alert.severity === 'info',
          }"
        >
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="severity-badge">{{ alert.severity.toUpperCase() }}</span>
            <span class="font-semibold text-xs">{{ alert.name }}</span>
          </div>
          <div class="text-[11px] opacity-80 leading-snug">{{ alert.message }}</div>
          <div
            v-if="alert.explanation && showExplanations"
            class="text-[10px] opacity-50 mt-1 leading-snug italic"
          >
            {{ alert.explanation }}
          </div>
        </div>

        <button
          class="text-[10px] text-tron-cyan/40 mt-1 hover:text-tron-cyan/70 transition-colors"
          @click.stop="showExplanations = !showExplanations"
        >
          {{ showExplanations ? 'Hide' : 'Show' }} beginner explanations
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCompatibility } from '../composables/useCompatibility.js'

const { alerts, errors, warnings, infos } = useCompatibility()
const expanded = ref(true)
const showExplanations = ref(true)
</script>

<style scoped>
.compat-alerts {
  position: absolute;
  bottom: 12px;
  left: 12px;
  max-width: 380px;
  z-index: 15;
}

.alerts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(13, 17, 23, 0.95);
  border: 1px solid rgba(255, 0, 60, 0.2);
  padding: 6px 12px;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.alerts-list {
  background: rgba(13, 17, 23, 0.95);
  border: 1px solid rgba(0, 240, 255, 0.1);
  border-top: none;
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
}

.alert-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-left: 2px solid;
}

.alert-error {
  border-color: var(--color-tron-red);
  background: rgba(255, 0, 60, 0.04);
  color: #ffa0b4;
}
.alert-warning {
  border-color: var(--color-tron-yellow);
  background: rgba(255, 184, 0, 0.04);
  color: #ffe0a0;
}
.alert-info {
  border-color: rgba(0, 240, 255, 0.3);
  background: rgba(0, 240, 255, 0.02);
  color: rgba(197, 208, 224, 0.7);
}

.severity-badge {
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  padding: 1px 4px;
  letter-spacing: 0.5px;
}
.alert-error .severity-badge {
  background: rgba(255, 0, 60, 0.15);
  color: var(--color-tron-red);
}
.alert-warning .severity-badge {
  background: rgba(255, 184, 0, 0.15);
  color: var(--color-tron-yellow);
}
.alert-info .severity-badge {
  background: rgba(0, 240, 255, 0.1);
  color: rgba(0, 240, 255, 0.5);
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
