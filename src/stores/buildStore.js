import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { CATEGORIES } from '../utils/helpers.js'

const DRAFTS_KEY = 'quadcalc_drafts'
const MAX_DRAFTS = 5

function emptyBuild() {
  const components = {}
  CATEGORIES.forEach(c => { components[c.key] = null })
  return components
}

function snapshotComponents(comps) {
  return JSON.parse(JSON.stringify(comps))
}

function saveDraft(name, comps) {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    const drafts = raw ? JSON.parse(raw) : []
    drafts.push({
      name,
      timestamp: Date.now(),
      components: snapshotComponents(comps),
    })
    // Keep only last MAX_DRAFTS
    while (drafts.length > MAX_DRAFTS) drafts.shift()
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch { /* localStorage full or unavailable */ }
}

function loadLatestDraft() {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    const drafts = raw ? JSON.parse(raw) : []
    return drafts.length > 0 ? drafts[drafts.length - 1] : null
  } catch {
    return null
  }
}

export const useBuildStore = defineStore('build', () => {
  const components = ref(emptyBuild())
  const buildName = ref('Untitled Build')
  const selectedCategory = ref(null)

  // Undo/redo history
  const undoStack = ref([])
  const redoStack = ref([])
  const MAX_HISTORY = 50
  let skipSnapshot = false

  function pushUndo() {
    if (skipSnapshot) return
    undoStack.value.push(snapshotComponents(components.value))
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function undo() {
    if (!canUndo.value) return
    redoStack.value.push(snapshotComponents(components.value))
    const prev = undoStack.value.pop()
    skipSnapshot = true
    Object.keys(components.value).forEach(k => {
      components.value[k] = prev[k] || null
    })
    skipSnapshot = false
  }

  function redo() {
    if (!canRedo.value) return
    undoStack.value.push(snapshotComponents(components.value))
    const next = redoStack.value.pop()
    skipSnapshot = true
    Object.keys(components.value).forEach(k => {
      components.value[k] = next[k] || null
    })
    skipSnapshot = false
  }

  const filledCount = computed(() =>
    Object.values(components.value).filter(Boolean).length
  )

  const totalCost = computed(() =>
    Object.values(components.value).reduce((sum, c) => {
      if (!c?.cost) return sum
      if (c.category === 'motors') return sum + c.cost * 4
      return sum + c.cost
    }, 0)
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
    pushUndo()
    if (component) {
      components.value[category] = { ...component, category }
    } else {
      components.value[category] = null
    }
  }

  function clearComponent(category) {
    pushUndo()
    components.value[category] = null
  }

  function clearAll() {
    pushUndo()
    Object.keys(components.value).forEach(k => { components.value[k] = null })
    buildName.value = 'Untitled Build'
  }

  function loadBuild(build) {
    pushUndo()
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

  // Auto-save draft on every component change (debounced)
  let draftTimer = null
  watch(components, () => {
    if (skipSnapshot) return
    clearTimeout(draftTimer)
    draftTimer = setTimeout(() => {
      const hasAny = Object.values(components.value).some(Boolean)
      if (hasAny) saveDraft(buildName.value, components.value)
    }, 1000)
  }, { deep: true })

  // Restore latest draft on startup if build is empty
  const hasComponents = Object.values(components.value).some(Boolean)
  if (!hasComponents) {
    const draft = loadLatestDraft()
    if (draft && draft.components) {
      buildName.value = draft.name || 'Untitled Build'
      Object.keys(components.value).forEach(k => {
        components.value[k] = draft.components[k] || null
      })
    }
  }

  return {
    components,
    buildName,
    selectedCategory,
    filledCount,
    totalCost,
    totalWeight,
    canUndo,
    canRedo,
    undo,
    redo,
    setComponent,
    clearComponent,
    clearAll,
    loadBuild,
    exportBuild,
  }
})
