<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div v-if="active" class="tour-overlay" @click.self="endTour">
        <!-- Spotlight cutout -->
        <div
          class="tour-spotlight"
          :style="spotlightStyle"
        ></div>

        <!-- Tooltip -->
        <div class="tour-tooltip tron-panel" :style="tooltipStyle" ref="tooltipRef">
          <div class="tour-step-counter">{{ currentIndex + 1 }} / {{ steps.length }}</div>
          <h4 class="tour-step-title">{{ currentStep.title }}</h4>
          <p class="tour-step-text">{{ currentStep.text }}</p>
          <div class="tour-nav">
            <button v-if="currentIndex > 0" class="tron-btn tour-btn" @click="prev">PREV</button>
            <span v-else></span>
            <div class="tour-nav-right">
              <button class="tron-btn tour-btn tour-btn-end" @click="endTour">END TOUR</button>
              <button v-if="currentIndex < steps.length - 1" class="tron-btn tron-btn-success tour-btn" @click="next">NEXT</button>
              <button v-else class="tron-btn tron-btn-success tour-btn" @click="endTour">DONE</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['end'])

const STEPS = [
  {
    title: 'The Drone Diagram',
    text: 'Each circle represents a component on your quad. Click any one to browse presets and add it to your build.',
    target: '.quad-diagram-wrapper',
    position: 'top',
  },
  {
    title: 'Build Stats',
    text: 'Track your build\'s cost, weight, thrust-to-weight ratio, compatibility score, and estimated flight time — all updated in real time.',
    target: '.build-summary',
    position: 'bottom',
  },
  {
    title: 'Builds & Templates',
    text: 'Save your build, load starter templates, import/export as JSON or CSV, and share a link with friends.',
    target: '.share-wrapper',
    position: 'bottom',
  },
  {
    title: 'Compatibility Checks',
    text: 'QuadCalc automatically checks if your parts work together. Mismatched props, wrong voltage, incompatible video systems — it catches it all.',
    target: '.quad-diagram-wrapper',
    position: 'top',
  },
  {
    title: 'AI Assistant',
    text: 'Ask the AI anything about your build — "What motor for a 5-inch?", "Is this compatible?", or "What should I buy next?". Needs a free OpenRouter API key.',
    targetText: 'AI',
    position: 'top',
  },
  {
    title: 'Import from URL',
    text: 'Paste a product link from any FPV store and the AI will extract the specs automatically — great for adding parts that aren\'t in the preset list.',
    targetText: 'IMPORT URL',
    position: 'bottom',
  },
]

const steps = STEPS
const currentIndex = ref(0)
const tooltipRef = ref(null)
const targetRect = ref({ top: 0, left: 0, width: 0, height: 0 })

const currentStep = computed(() => steps[currentIndex.value])

function findTarget() {
  const step = currentStep.value
  if (step.target) {
    const el = document.querySelector(step.target)
    if (el) return el
  }
  if (step.targetText) {
    const buttons = document.querySelectorAll('button')
    for (const btn of buttons) {
      if (btn.textContent.trim() === step.targetText) return btn
    }
  }
  return null
}

function updateRect() {
  const el = findTarget()
  if (el) {
    const r = el.getBoundingClientRect()
    const pad = 8
    targetRect.value = {
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    }
  } else {
    // Center of screen fallback
    targetRect.value = {
      top: window.innerHeight / 2 - 50,
      left: window.innerWidth / 2 - 100,
      width: 200,
      height: 100,
    }
  }
}

const spotlightStyle = computed(() => ({
  top: `${targetRect.value.top}px`,
  left: `${targetRect.value.left}px`,
  width: `${targetRect.value.width}px`,
  height: `${targetRect.value.height}px`,
}))

const tooltipStyle = computed(() => {
  const r = targetRect.value
  const pos = currentStep.value.position || 'bottom'
  const tooltipWidth = 320
  let top, left

  if (pos === 'bottom') {
    top = r.top + r.height + 12
    left = r.left + r.width / 2 - tooltipWidth / 2
  } else {
    top = r.top - 12
    left = r.left + r.width / 2 - tooltipWidth / 2
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12))
  if (pos === 'top') {
    // Position above — will use transform to shift up
    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      transform: 'translateY(-100%)',
    }
  }
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${tooltipWidth}px`,
  }
})

function next() {
  if (currentIndex.value < steps.length - 1) {
    currentIndex.value++
    nextTick(updateRect)
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    nextTick(updateRect)
  }
}

function endTour() {
  currentIndex.value = 0
  emit('end')
}

// Handle keyboard
function onKeyDown(e) {
  if (!props.active) return
  if (e.key === 'Escape') endTour()
  if (e.key === 'ArrowRight') next()
  if (e.key === 'ArrowLeft') prev()
}

watch(() => props.active, (val) => {
  if (val) {
    currentIndex.value = 0
    nextTick(updateRect)
    window.addEventListener('resize', updateRect)
    window.addEventListener('keydown', onKeyDown)
  } else {
    window.removeEventListener('resize', updateRect)
    window.removeEventListener('keydown', onKeyDown)
  }
})

watch(currentIndex, () => {
  nextTick(updateRect)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRect)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
}

.tour-spotlight {
  position: fixed;
  border-radius: 8px;
  box-shadow: 0 0 0 4px var(--qc-cyan-03), 0 0 0 9999px rgba(0, 0, 0, 0.55);
  transition: all 0.35s ease;
  pointer-events: none;
  z-index: 101;
}

.tour-tooltip {
  position: fixed;
  z-index: 102;
  padding: 16px;
  border: 1px solid var(--qc-cyan-03);
  box-shadow: var(--qc-glow-cyan), 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.35s ease;
}

.tour-step-counter {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: var(--qc-text-muted);
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.tour-step-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--qc-cyan);
  letter-spacing: 0.5px;
  margin: 0 0 6px 0;
  text-shadow: var(--qc-glow-text-cyan);
}

.tour-step-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  color: var(--qc-text);
  line-height: 1.5;
  margin: 0 0 14px 0;
}

.tour-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tour-nav-right {
  display: flex;
  gap: 6px;
}

.tour-btn {
  font-size: 10px;
  padding: 4px 10px;
}

.tour-btn-end {
  opacity: 0.6;
}
.tour-btn-end:hover {
  opacity: 1;
}

.tour-fade-enter-active {
  transition: opacity 0.3s ease-out;
}
.tour-fade-leave-active {
  transition: opacity 0.2s ease-in;
}
.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}
</style>
