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

  // Would assigning `item` to `category` break a hard (error) compatibility rule
  // against what's already in the build? Used to filter the selector to
  // compatible-only options. Shared by ComponentPanel and the guided wizard.
  // `restrictTo`, if provided, limits which other categories are considered —
  // the guided wizard passes only earlier steps so a part is never filtered
  // against a choice that comes later in the flow.
  function isIncompatibleItem(category, item, restrictTo = null) {
    const mock = { ...item, category }
    for (const rule of compatibilityRules) {
      if (rule.severity !== 'error' || !rule.categories.includes(category)) continue
      const otherCat = rule.categories[0] === category ? rule.categories[1] : rule.categories[0]
      if (restrictTo && !restrictTo.has(otherCat)) continue
      const otherComp = store.components[otherCat]
      if (!otherComp) continue
      const thisIsFirst = rule.categories[0] === category
      const a = thisIsFirst ? mock : otherComp
      const b = thisIsFirst ? otherComp : mock
      if (rule.check(a, b)) return true
    }
    return false
  }

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
    isIncompatibleItem,
  }
}
