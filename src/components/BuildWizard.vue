<template>
  <Teleport to="body">
    <Transition name="wiz-fade">
      <div v-if="show" class="wiz-overlay">
        <div class="wiz" :class="{ mobile: isMobile }">

          <!-- Top bar -->
          <header class="wiz-top">
            <div class="wiz-brand">
              <span class="wiz-logo">QUADCALC</span>
              <span class="wiz-badge">● GUIDED BUILD</span>
            </div>
            <button class="wiz-exit" @click="$emit('close')">✕ EXIT TO DIAGRAM</button>
          </header>

          <!-- Progress rail -->
          <div class="wiz-rail" ref="railRef">
            <template v-for="(s, i) in STEPS" :key="s.key">
              <div
                class="wiz-step"
                :class="stepStatus(i)"
                :ref="i === stepIndex ? 'activeStepRef' : undefined"
                @click="goTo(i)"
              >
                <div class="wiz-dot">{{ stepStatus(i) === 'done' ? '✓' : i + 1 }}</div>
                <div class="wiz-steplbl">{{ shortLabel(s.key) }}</div>
              </div>
              <div v-if="i < STEPS.length - 1" class="wiz-conn"></div>
            </template>
          </div>

          <!-- Main -->
          <div class="wiz-main" ref="mainRef">
            <!-- Explainer -->
            <div class="wiz-explain" ref="explainRef">
              <div class="wiz-ex-head">
                <div class="wiz-ex-icon">
                  <svg v-if="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path v-for="(d, i) in icon.paths" :key="'p'+i" :d="d" />
                    <circle v-for="(c, i) in icon.circles || []" :key="'c'+i" :cx="c.cx" :cy="c.cy" :r="c.r" />
                    <rect v-for="(r, i) in icon.rects || []" :key="'r'+i" :x="r.x" :y="r.y" :width="r.width" :height="r.height" :rx="r.rx || 0" />
                  </svg>
                </div>
                <div>
                  <div class="wiz-ex-step">STEP {{ stepIndex + 1 }} OF {{ STEPS.length }}</div>
                  <div class="wiz-ex-title">{{ cat?.label }}</div>
                </div>
              </div>

              <div class="wiz-block">
                <div class="wiz-block-lbl">What it is</div>
                <div class="wiz-text">{{ content.whatItIs }}</div>
              </div>

              <div class="wiz-block">
                <button class="wiz-why-toggle" @click="showWhy = !showWhy">
                  Why it matters most <span class="wiz-caret">{{ showWhy ? '▾' : '▸' }}</span>
                </button>
                <div v-show="showWhy" class="wiz-text wiz-why">{{ content.whyItMatters }}</div>
              </div>

              <div class="wiz-block">
                <div class="wiz-block-lbl">What to look for</div>
                <div class="wiz-chips">
                  <span class="wiz-chip" v-for="lf in content.lookFor" :key="lf.label">
                    <b>{{ lf.label }}</b> · {{ lf.note }}
                  </span>
                </div>
              </div>

              <div class="wiz-tip">
                <span class="wiz-tip-icon">💡</span>
                <span class="wiz-tip-text"><b>Rookie tip:</b> {{ content.rookieTip }}</span>
              </div>
            </div>

            <!-- Picks -->
            <div class="wiz-picks">
              <div class="wiz-picks-head">
                <span class="wiz-picks-title">CHOOSE {{ pickLabel }}</span>
                <span class="wiz-compat">✓ compatible only</span>
              </div>

              <div v-if="isAio" class="wiz-aio-note">
                ✓ Already included in your flight controller — you can skip this step.
              </div>

              <ComponentSelector
                class="wiz-selector"
                :items="compatibleItems"
                :selected="selected"
                :category="category"
                @select="selectItem"
              />
            </div>
          </div>

          <!-- Bottom bar -->
          <footer class="wiz-bottom">
            <div class="wiz-stats">
              <div class="wiz-stat"><div class="v cy">{{ filled }}<span class="faint">/{{ STEPS.length }}</span></div><div class="k">PICKED</div></div>
              <div class="wiz-stat"><div class="v">{{ cost }}</div><div class="k">COST</div></div>
              <div class="wiz-stat"><div class="v">{{ weight }}</div><div class="k">WEIGHT</div></div>
              <div class="wiz-stat"><div class="v" :class="{ faint: twr === '—' }">{{ twr }}</div><div class="k">TWR</div></div>
            </div>
            <div class="wiz-nav">
              <button class="wiz-btn ghost" :disabled="isFirst" @click="back">← BACK</button>
              <button class="wiz-btn ghost" @click="skip">SKIP</button>
              <button class="wiz-btn primary" @click="next">{{ nextLabel }}</button>
            </div>
          </footer>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useStorage } from '../composables/useStorage.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { presets } from '../data/presets.js'
import { wizardContent } from '../data/wizardContent.js'
import { CATEGORIES, CATEGORY_MAP, formatCurrency, formatWeight, formatTWR } from '../utils/helpers.js'
import { ICONS } from '../utils/icons.js'
import ComponentSelector from './ComponentSelector.vue'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const store = useBuildStore()
const { getCustomPresets } = useStorage()
const { isIncompatibleItem } = useCompatibility()
const isMobile = inject('isMobile', ref(false))

// All categories except Accessories, in build order
const STEPS = CATEGORIES.filter(c => c.key !== 'other')

const SHORT = {
  frame: 'Frame', motors: 'Motors', propellers: 'Props', battery: 'Battery',
  fc: 'FC', esc: 'ESC', vtx: 'VTX', vtxAntenna: 'VTX Ant', camera: 'Camera',
  rx: 'RX', rxAntenna: 'RX Ant', tx: 'TX', goggles: 'Goggles',
}
function shortLabel(key) { return SHORT[key] || CATEGORY_MAP[key]?.label || key }

const stepIndex = ref(0)
const showWhy = ref(true)
const railRef = ref(null)
const activeStepRef = ref(null)
const mainRef = ref(null)
const explainRef = ref(null)

// On open, resume at the first empty step (or start at the beginning)
watch(() => props.show, (val) => {
  if (!val) return
  const firstEmpty = STEPS.findIndex(s => !store.components[s.key])
  stepIndex.value = firstEmpty === -1 ? 0 : firstEmpty
  showWhy.value = true
  resetScroll()
  scrollActiveIntoView()
})

const step = computed(() => STEPS[stepIndex.value])
const category = computed(() => step.value.key)
const cat = computed(() => CATEGORY_MAP[category.value])
const icon = computed(() => (cat.value ? ICONS[cat.value.icon] : null))
const content = computed(() => wizardContent[category.value] || { whatItIs: '', whyItMatters: '', lookFor: [], rookieTip: '' })
const pickLabel = computed(() => (SHORT[category.value] || cat.value?.label || '').toUpperCase())

const presetItems = computed(() => {
  const builtIn = presets[category.value] || []
  const custom = getCustomPresets()[category.value] || []
  return [...custom, ...builtIn]
})
// Only constrain a step by choices from earlier steps (Frame, step 1, is
// unconstrained). The current selection is always shown so it's never hidden.
const earlierCats = computed(() => new Set(STEPS.slice(0, stepIndex.value).map(s => s.key)))
const compatibleItems = computed(() =>
  presetItems.value.filter(i =>
    i.id === selected.value?.id || !isIncompatibleItem(category.value, i, earlierCats.value)
  )
)
const selected = computed(() => store.components[category.value])
const isAio = computed(() => !!selected.value?._aioVirtual)

function selectItem(item) { store.setComponent(category.value, item) }

// Steps whose part the AIO board already filled in are auto-skipped during
// navigation — beginners shouldn't tap through parts they don't need to choose.
function isAioIncluded(i) { return !!store.components[STEPS[i].key]?._aioVirtual }
function nextVisitable(from) {
  for (let i = from + 1; i < STEPS.length; i++) if (!isAioIncluded(i)) return i
  return -1
}
function prevVisitable(from) {
  for (let i = from - 1; i >= 0; i--) if (!isAioIncluded(i)) return i
  return -1
}

const isFirst = computed(() => prevVisitable(stepIndex.value) === -1)
const isLast = computed(() => nextVisitable(stepIndex.value) === -1)

function goTo(i) { stepIndex.value = i; showWhy.value = true; resetScroll(); scrollActiveIntoView() }

// Each new step should start at the top — don't leave the page scrolled down
// into the previous step's parts list.
function resetScroll() {
  nextTick(() => {
    if (mainRef.value) mainRef.value.scrollTop = 0
    if (explainRef.value) explainRef.value.scrollTop = 0
  })
}
function next() { const n = nextVisitable(stepIndex.value); n === -1 ? emit('close') : goTo(n) }
function back() { const p = prevVisitable(stepIndex.value); if (p !== -1) goTo(p) }
function skip() { next() }

function scrollActiveIntoView() {
  nextTick(() => {
    const el = Array.isArray(activeStepRef.value) ? activeStepRef.value[0] : activeStepRef.value
    el?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  })
}

function stepStatus(i) {
  if (i === stepIndex.value) return 'active'
  if (store.components[STEPS[i].key]) return 'done'
  return ''
}

const filled = computed(() => STEPS.filter(s => store.components[s.key]).length)
const cost = computed(() => formatCurrency(store.totalCost))
const weight = computed(() => formatWeight(store.totalWeight))
const twr = computed(() => (store.thrustToWeightRatio != null ? formatTWR(store.thrustToWeightRatio) : '—'))

const nextLabel = computed(() => {
  const n = nextVisitable(stepIndex.value)
  return n === -1 ? 'FINISH ✓' : `NEXT: ${shortLabel(STEPS[n].key).toUpperCase()} →`
})
</script>

<style scoped>
.wiz-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--qc-overlay);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wiz {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--qc-surface);
  border-left: 1px solid var(--qc-cyan-02);
  border-right: 1px solid var(--qc-cyan-02);
}

/* Top */
.wiz-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  border-bottom: 1px solid var(--qc-cyan-01);
  flex-shrink: 0;
}
.wiz-brand { display: flex; align-items: center; gap: 12px; }
.wiz-logo { font-family: 'Orbitron', sans-serif; font-weight: 800; color: var(--qc-cyan); letter-spacing: 3px; font-size: 15px; text-shadow: var(--qc-glow-text-cyan); }
.wiz-badge { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: var(--qc-green); border: 1px solid var(--qc-green-03); background: var(--qc-green-006); padding: 3px 8px; }
.wiz-exit { font-family: 'Orbitron', sans-serif; font-size: 10px; letter-spacing: 1px; color: var(--qc-text-muted); border: 1px solid var(--qc-cyan-02); background: transparent; padding: 6px 12px; cursor: pointer; transition: all 0.15s; }
.wiz-exit:hover { color: var(--qc-cyan); border-color: var(--qc-cyan); }

/* Rail */
.wiz-rail { display: flex; align-items: center; gap: 6px; padding: 12px 18px; overflow-x: auto; border-bottom: 1px solid var(--qc-cyan-008); flex-shrink: 0; }
.wiz-step { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 50px; flex: 0 0 auto; cursor: pointer; }
.wiz-dot { width: 26px; height: 26px; border-radius: 50%; border: 1px solid var(--qc-cyan-02); display: flex; align-items: center; justify-content: center; font-family: 'Share Tech Mono', monospace; font-size: 10px; color: var(--qc-text-muted); transition: all 0.2s; }
.wiz-step.done .wiz-dot { border-color: var(--qc-green-03); color: var(--qc-green); background: var(--qc-green-006); }
.wiz-step.active .wiz-dot { border-color: var(--qc-cyan); color: var(--qc-cyan); background: var(--qc-cyan-008); box-shadow: var(--qc-glow-cyan); }
.wiz-steplbl { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 0.5px; color: var(--qc-text-faint); text-transform: uppercase; white-space: nowrap; }
.wiz-step.active .wiz-steplbl { color: var(--qc-cyan); }
.wiz-step.done .wiz-steplbl { color: var(--qc-text-muted); }
.wiz-conn { height: 1px; width: 14px; background: var(--qc-cyan-02); flex: 0 0 auto; margin-bottom: 18px; }

/* Main */
.wiz-main { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 18px; overflow: hidden; }

/* Explainer */
.wiz-explain { overflow-y: auto; padding-right: 4px; }
.wiz-ex-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.wiz-ex-icon { width: 46px; height: 46px; border: 1px solid var(--qc-cyan-03); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--qc-cyan); box-shadow: var(--qc-glow-cyan); flex-shrink: 0; }
.wiz-ex-step { font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 2px; color: var(--qc-cyan-05); }
.wiz-ex-title { font-family: 'Orbitron', sans-serif; font-size: 21px; font-weight: 700; color: var(--qc-cyan); letter-spacing: 1px; text-shadow: var(--qc-glow-text-cyan); line-height: 1.1; }
.wiz-block { margin-top: 14px; }
.wiz-block-lbl { font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: var(--qc-cyan-05); text-transform: uppercase; margin-bottom: 4px; }
.wiz-text { font-size: 15px; line-height: 1.5; color: var(--qc-text); }
.wiz-why { margin-top: 4px; }
.wiz-why-toggle { background: none; border: none; padding: 0; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 1.5px; color: var(--qc-cyan-05); text-transform: uppercase; display: flex; align-items: center; gap: 5px; }
.wiz-why-toggle:hover { color: var(--qc-cyan); }
.wiz-caret { font-size: 9px; }
.wiz-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.wiz-chip { font-family: 'Share Tech Mono', monospace; font-size: 11px; padding: 4px 9px; border: 1px solid var(--qc-cyan-015); background: var(--qc-cyan-005); color: var(--qc-text); }
.wiz-chip b { color: var(--qc-cyan); }
.wiz-tip { margin-top: 16px; display: flex; gap: 10px; padding: 11px 13px; background: var(--qc-green-006); border: 1px solid var(--qc-green-02); border-left: 3px solid var(--qc-green); }
.wiz-tip-icon { font-size: 15px; }
.wiz-tip-text { font-size: 12.5px; line-height: 1.5; color: var(--qc-text); }
.wiz-tip-text b { color: var(--qc-green); }

/* Picks */
.wiz-picks { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.wiz-picks-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; flex-shrink: 0; }
.wiz-picks-title { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; color: var(--qc-text-bright); letter-spacing: 1px; }
.wiz-compat { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: var(--qc-green); letter-spacing: 0.3px; }
.wiz-aio-note { font-family: 'Share Tech Mono', monospace; font-size: 11px; color: var(--qc-green); background: var(--qc-green-006); border: 1px solid var(--qc-green-02); padding: 8px 10px; margin-bottom: 8px; flex-shrink: 0; }
.wiz-selector { flex: 1; min-height: 0; }

/* Bottom */
.wiz-bottom { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 18px; background: var(--qc-surface); border-top: 1px solid var(--qc-cyan-02); flex-shrink: 0; }
.wiz-stats { display: flex; gap: 20px; }
.wiz-stat { text-align: center; }
.wiz-stat .v { font-family: 'Orbitron', sans-serif; font-weight: 700; font-size: 15px; color: var(--qc-text-bright); line-height: 1.1; }
.wiz-stat .v.cy { color: var(--qc-cyan); }
.wiz-stat .v.faint, .wiz-stat .faint { color: var(--qc-text-muted); }
.wiz-stat .k { font-family: 'Share Tech Mono', monospace; font-size: 8px; letter-spacing: 1px; color: var(--qc-text-muted); }
.wiz-nav { display: flex; gap: 8px; }
.wiz-btn { font-family: 'Orbitron', sans-serif; font-size: 11px; letter-spacing: 1px; padding: 9px 16px; cursor: pointer; background: transparent; border: 1px solid var(--qc-cyan-02); color: var(--qc-text); transition: all 0.15s; }
.wiz-btn.ghost { color: var(--qc-text-muted); }
.wiz-btn.ghost:hover:not(:disabled) { color: var(--qc-cyan); border-color: var(--qc-cyan-03); }
.wiz-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.wiz-btn.primary { background: var(--qc-cyan-008); border-color: var(--qc-cyan); color: var(--qc-cyan); box-shadow: var(--qc-glow-cyan); }
.wiz-btn.primary:hover { background: var(--qc-cyan-015); }

.wiz-fade-enter-active, .wiz-fade-leave-active { transition: opacity 0.2s ease; }
.wiz-fade-enter-from, .wiz-fade-leave-to { opacity: 0; }

/* Mobile */
.wiz.mobile { max-width: 100%; height: 100dvh; max-height: 100dvh; border: none; }
.wiz.mobile .wiz-top { padding: 9px 12px; }
.wiz.mobile .wiz-logo { font-size: 13px; letter-spacing: 2px; }
.wiz.mobile .wiz-exit { padding: 6px 9px; }
.wiz.mobile .wiz-rail { padding: 10px 12px; }
.wiz.mobile .wiz-main { grid-template-columns: 1fr; gap: 12px; padding: 12px; overflow-y: auto; }
.wiz.mobile .wiz-explain { overflow: visible; }
.wiz.mobile .wiz-ex-title { font-size: 19px; }
.wiz.mobile .wiz-picks { overflow: visible; }
/* On mobile the list expands to full height and the whole step scrolls as one
   page (via .wiz-main), instead of a cramped nested scroll box. */
.wiz.mobile .wiz-selector { flex: none; height: auto; }
.wiz.mobile :deep(.selector-root) { height: auto; }
.wiz.mobile :deep(.selector-list) { overflow: visible; flex: none; min-height: 0; }
.wiz.mobile .wiz-bottom { flex-direction: column; align-items: stretch; gap: 10px; padding: 10px 12px; }
.wiz.mobile .wiz-stats { justify-content: space-between; gap: 6px; }
.wiz.mobile .wiz-nav { display: grid; grid-template-columns: auto auto 1fr; gap: 8px; }
.wiz.mobile .wiz-btn.primary { grid-column: 3; }
</style>
