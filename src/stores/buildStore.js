import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CATEGORIES } from '../utils/helpers.js'

function emptyBuild() {
  const components = {}
  CATEGORIES.forEach(c => { components[c.key] = null })
  return components
}

export const useBuildStore = defineStore('build', () => {
  const components = ref(emptyBuild())
  const buildName = ref('Untitled Build')
  const selectedCategory = ref(null)

  const filledCount = computed(() =>
    Object.values(components.value).filter(Boolean).length
  )

  const totalCost = computed(() =>
    Object.values(components.value).reduce((sum, c) => sum + (c?.cost || 0), 0)
  )

  const totalWeight = computed(() =>
    Object.values(components.value).reduce((sum, c) => {
      if (!c?.weight) return sum
      // Motors and props: multiply by 4
      if (c.category === 'motors' || c.category === 'propellers') return sum + c.weight * 4
      return sum + c.weight
    }, 0)
  )

  function setComponent(category, component) {
    if (component) {
      components.value[category] = { ...component, category }
    } else {
      components.value[category] = null
    }
  }

  function clearComponent(category) {
    components.value[category] = null
  }

  function clearAll() {
    Object.keys(components.value).forEach(k => { components.value[k] = null })
    buildName.value = 'Untitled Build'
  }

  function loadBuild(build) {
    buildName.value = build.name || 'Loaded Build'
    const comps = build.components || {}
    Object.keys(components.value).forEach(k => {
      components.value[k] = comps[k] || null
    })
  }

  function exportBuild() {
    return {
      name: buildName.value,
      timestamp: Date.now(),
      components: { ...components.value },
    }
  }

  return {
    components,
    buildName,
    selectedCategory,
    filledCount,
    totalCost,
    totalWeight,
    setComponent,
    clearComponent,
    clearAll,
    loadBuild,
    exportBuild,
  }
})
