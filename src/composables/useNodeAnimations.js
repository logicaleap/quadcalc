import { reactive, watch, ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from '../composables/useCompatibility.js'
import { CATEGORIES } from '../utils/helpers.js'

// Animation durations (ms)
const DURATIONS = {
  'power-on': 600,
  'power-off': 400,
  'lock-in': 300,
  'error-pulse': 800,
  'ok-flash': 500,
  'warning-pulse': 700,
}

export function useNodeAnimations() {
  const store = useBuildStore()
  const { getCategoryStatus } = useCompatibility()

  // Map<categoryKey, { type: string, active: boolean }>
  const animationState = reactive(new Map())

  // Snapshot of previous component state for change detection
  const prevComponents = ref({})
  const prevStatuses = ref({})
  let initialized = false

  function triggerAnimation(key, type) {
    animationState.set(key, { type, active: true })
    const dur = DURATIONS[type] || 500
    setTimeout(() => {
      const current = animationState.get(key)
      if (current && current.type === type) {
        animationState.set(key, { type, active: false })
      }
    }, dur)
  }

  // Watch component changes
  watch(
    () => store.components,
    (comps) => {
      if (!initialized) {
        // First run — just snapshot, don't animate
        for (const cat of CATEGORIES) {
          prevComponents.value[cat.key] = comps[cat.key] ? comps[cat.key].id || comps[cat.key].name : null
        }
        initialized = true
        return
      }

      for (const cat of CATEGORIES) {
        const prev = prevComponents.value[cat.key]
        const curr = comps[cat.key]
        const currId = curr ? curr.id || curr.name : null

        if (prev === null && currId !== null) {
          triggerAnimation(cat.key, 'power-on')
        } else if (prev !== null && currId === null) {
          triggerAnimation(cat.key, 'power-off')
        } else if (prev !== null && currId !== null && prev !== currId) {
          triggerAnimation(cat.key, 'lock-in')
        }

        prevComponents.value[cat.key] = currId
      }
    },
    { deep: true }
  )

  // Watch compatibility status changes
  watch(
    () => {
      const statuses = {}
      for (const cat of CATEGORIES) {
        statuses[cat.key] = getCategoryStatus(cat.key)
      }
      return statuses
    },
    (statuses) => {
      for (const cat of CATEGORIES) {
        const prev = prevStatuses.value[cat.key]
        const curr = statuses[cat.key]

        if (prev && prev !== curr) {
          if (curr === 'error') {
            triggerAnimation(cat.key, 'error-pulse')
          } else if (curr === 'warning') {
            triggerAnimation(cat.key, 'warning-pulse')
          } else if (curr === 'ok' && prev === 'error') {
            triggerAnimation(cat.key, 'ok-flash')
          }
        }
      }

      for (const cat of CATEGORIES) {
        prevStatuses.value[cat.key] = statuses[cat.key]
      }
    },
    { deep: true }
  )

  return { animationState }
}
