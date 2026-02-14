<template>
  <Transition name="slide">
    <div v-if="store.selectedCategory" class="component-panel tron-panel animate-fade-in">
      <div class="panel-header">
        <div class="flex items-center gap-2">
          <svg v-if="currentIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-tron-cyan">
            <path v-for="(d, i) in currentIcon.paths" :key="'p'+i" :d="d" />
            <circle v-for="(c, i) in currentIcon.circles || []" :key="'c'+i" :cx="c.cx" :cy="c.cy" :r="c.r" />
            <rect v-for="(r, i) in currentIcon.rects || []" :key="'r'+i" :x="r.x" :y="r.y" :width="r.width" :height="r.height" :rx="r.rx || 0" />
          </svg>
          <h3 class="text-tron-cyan text-sm font-bold tracking-wider uppercase">
            {{ currentCat?.label }}
          </h3>
        </div>
        <button class="tron-btn text-xs px-2 py-1" @click="store.selectedCategory = null">
          CLOSE
        </button>
      </div>

      <!-- Current component info -->
      <div v-if="currentComponent" class="current-component">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="text-tron-text-bright font-semibold text-sm">{{ currentComponent.name }}</h4>
            <p class="text-xs text-tron-text/60 mt-0.5">{{ currentComponent.description }}</p>
          </div>
          <button class="tron-btn-danger tron-btn text-[10px] px-2 py-0.5 shrink-0" @click="clearSlot">
            REMOVE
          </button>
        </div>

        <div class="grid grid-cols-2 gap-1 mt-2">
          <div class="spec-chip" v-if="currentComponent.cost">
            <span class="label">Cost</span>
            <span class="value">{{ formatCurrency(currentComponent.cost) }}</span>
          </div>
          <div class="spec-chip" v-if="currentComponent.weight">
            <span class="label">Weight</span>
            <span class="value">{{ formatWeight(currentComponent.weight) }}{{ isMultiplied ? ' x4' : '' }}</span>
          </div>
          <div
            v-for="(val, key) in currentComponent.specs"
            :key="key"
            class="spec-chip"
          >
            <span class="label">{{ key }}</span>
            <span class="value">{{ Array.isArray(val) ? val.join(', ') : val }}</span>
          </div>
        </div>

        <!-- Related alerts -->
        <div v-if="relatedAlerts.length > 0" class="mt-3 space-y-1">
          <div
            v-for="alert in relatedAlerts"
            :key="alert.id"
            class="text-xs p-2 border"
            :class="{
              'border-tron-red/30 bg-tron-red/5 text-tron-red': alert.severity === 'error',
              'border-tron-yellow/30 bg-tron-yellow/5 text-tron-yellow': alert.severity === 'warning',
              'border-tron-cyan/20 bg-tron-cyan/5 text-tron-cyan/70': alert.severity === 'info',
            }"
          >
            <div class="font-bold">{{ alert.severity.toUpperCase() }}: {{ alert.name }}</div>
            <div class="mt-0.5 opacity-80">{{ alert.message }}</div>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-tron-text/40 py-4 text-sm shrink-0">
        No component selected. Pick one below.
      </div>

      <!-- Separator -->
      <div class="border-t border-tron-cyan/10 my-3 shrink-0"></div>

      <!-- Selector -->
      <div class="text-xs text-tron-text/50 mb-2 uppercase tracking-wider font-semibold shrink-0">Choose from presets</div>
      <ComponentSelector
        class="flex-1 min-h-0"
        :items="presetItems"
        :selected="currentComponent"
        @select="selectComponent"
      />
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { useStorage } from '../composables/useStorage.js'
import { CATEGORY_MAP, formatCurrency, formatWeight } from '../utils/helpers.js'
import { ICONS } from '../utils/icons.js'
import { presets } from '../data/presets.js'
import ComponentSelector from './ComponentSelector.vue'

const store = useBuildStore()
const { alerts } = useCompatibility()
const { getCustomPresets } = useStorage()

const currentCat = computed(() => {
  if (!store.selectedCategory) return null
  return CATEGORY_MAP[store.selectedCategory]
})

const currentIcon = computed(() => {
  return currentCat.value ? ICONS[currentCat.value.icon] : null
})

const currentComponent = computed(() => {
  if (!store.selectedCategory) return null
  return store.components[store.selectedCategory]
})

const isMultiplied = computed(() => {
  return store.selectedCategory === 'motors' || store.selectedCategory === 'propellers'
})

const presetItems = computed(() => {
  if (!store.selectedCategory) return []
  const builtIn = presets[store.selectedCategory] || []
  const custom = getCustomPresets()[store.selectedCategory] || []
  // Custom presets first, marked with _custom flag
  return [...custom, ...builtIn]
})

const relatedAlerts = computed(() => {
  if (!store.selectedCategory) return []
  return alerts.value.filter(a => a.categories.includes(store.selectedCategory))
})

function selectComponent(item) {
  store.setComponent(store.selectedCategory, item)
}

function clearSlot() {
  store.clearComponent(store.selectedCategory)
}
</script>

<style scoped>
.component-panel {
  position: absolute;
  right: 0;
  top: 48px;
  bottom: 0;
  width: 340px;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.current-component {
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 40%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
  flex-shrink: 0;
}

.spec-chip {
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  background: rgba(0, 240, 255, 0.03);
  border: 1px solid rgba(0, 240, 255, 0.08);
}
.spec-chip .label {
  font-size: 9px;
  text-transform: uppercase;
  color: rgba(0, 240, 255, 0.5);
  font-family: 'Share Tech Mono', monospace;
  letter-spacing: 0.5px;
}
.spec-chip .value {
  font-size: 12px;
  color: var(--color-tron-text-bright);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
