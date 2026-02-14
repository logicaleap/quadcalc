import { computed } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { compatibilityRules, compatibilityExplanations } from '../data/compatibilityRules.js'

export function useCompatibility() {
  const store = useBuildStore()

  const alerts = computed(() => {
    const results = []
    for (const rule of compatibilityRules) {
      const [catA, catB] = rule.categories
      const compA = store.components[catA]
      const compB = store.components[catB]
      if (!compA || !compB) continue
      const message = rule.check(compA, compB)
      if (message) {
        results.push({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          explanation: compatibilityExplanations[rule.id] || '',
          severity: rule.severity,
          message,
          categories: rule.categories,
        })
      }
    }
    return results
  })

  const errors = computed(() => alerts.value.filter(a => a.severity === 'error'))
  const warnings = computed(() => alerts.value.filter(a => a.severity === 'warning'))
  const infos = computed(() => alerts.value.filter(a => a.severity === 'info'))

  // Check how many rules pass vs total applicable rules
  const compatibilityScore = computed(() => {
    let applicable = 0
    let passing = 0
    for (const rule of compatibilityRules) {
      const [catA, catB] = rule.categories
      const compA = store.components[catA]
      const compB = store.components[catB]
      if (!compA || !compB) continue
      applicable++
      const message = rule.check(compA, compB)
      if (!message) passing++
    }
    if (applicable === 0) return 100
    return Math.round((passing / applicable) * 100)
  })

  // Get status for a specific category (for node coloring)
  function getCategoryStatus(category) {
    if (!store.components[category]) return 'empty'
    const related = alerts.value.filter(a => a.categories.includes(category))
    if (related.some(a => a.severity === 'error')) return 'error'
    if (related.some(a => a.severity === 'warning')) return 'warning'
    return 'ok'
  }

  return {
    alerts,
    errors,
    warnings,
    infos,
    compatibilityScore,
    getCategoryStatus,
  }
}
