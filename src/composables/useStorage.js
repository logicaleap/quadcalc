import { ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { CATEGORIES, formatCurrency, formatWeight } from '../utils/helpers.js'
import { presets } from '../data/presets.js'

const SHARE_KEYS = { f: 'frame', m: 'motors', pr: 'propellers', b: 'battery', fc: 'fc', e: 'esc', v: 'vtx', va: 'vtxAntenna', ca: 'camera', r: 'rx', ra: 'rxAntenna', t: 'tx', g: 'goggles', o: 'other' }
// Legacy key for backwards compat with old shared URLs
const LEGACY_SHARE_KEYS = { a: 'vtxAntenna' }
const SHARE_KEYS_REV = Object.fromEntries(Object.entries(SHARE_KEYS).map(([k, v]) => [v, k]))

const STORAGE_KEY = 'quadcalc_builds'
const SETTINGS_KEY = 'quadcalc_settings'
const CUSTOM_PRESETS_KEY = 'quadcalc_custom_presets'

export function useStorage() {
  const savedBuilds = ref([])

  function loadSavedBuilds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      savedBuilds.value = raw ? JSON.parse(raw) : []
    } catch {
      savedBuilds.value = []
    }
  }

  function saveBuild(name) {
    const store = useBuildStore()
    store.buildName = name || store.buildName
    const build = store.exportBuild()
    build.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    loadSavedBuilds()
    savedBuilds.value.push(build)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBuilds.value))
    return build
  }

  function loadBuild(buildId) {
    loadSavedBuilds()
    const build = savedBuilds.value.find(b => b.id === buildId)
    if (build) {
      const store = useBuildStore()
      store.loadBuild(build)
      return true
    }
    return false
  }

  function deleteBuild(buildId) {
    loadSavedBuilds()
    savedBuilds.value = savedBuilds.value.filter(b => b.id !== buildId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBuilds.value))
  }

  function exportBuildToFile() {
    const store = useBuildStore()
    const build = store.exportBuild()
    const json = JSON.stringify(build, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${build.name.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportBuildToCsv() {
    const store = useBuildStore()
    const rows = [['Category', 'Component', 'Description', 'Cost', 'Weight', 'Specs']]
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (comp) {
        const specsStr = comp.specs
          ? Object.entries(comp.specs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('/') : v}`).join('; ')
          : ''
        rows.push([
          cat.label,
          comp.name,
          comp.description || '',
          formatCurrency(comp.cost),
          formatWeight(comp.weight),
          specsStr,
        ])
      } else {
        rows.push([cat.label, '(empty)', '', '', '', ''])
      }
    }
    // Summary row
    rows.push([])
    rows.push(['TOTAL', '', '', formatCurrency(store.totalCost), formatWeight(store.totalWeight), ''])
    rows.push(['Build Name', store.buildName])
    rows.push(['Parts', `${store.filledCount} / ${CATEGORIES.length}`])

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.buildName.replace(/[^a-z0-9]/gi, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importBuildFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const build = JSON.parse(e.target.result)
          const store = useBuildStore()
          store.loadBuild(build)
          resolve(build)
        } catch (err) {
          reject(new Error('Invalid JSON file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  function generateShareUrl() {
    const store = useBuildStore()
    const ids = {}
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (comp?.id) {
        const shortKey = SHARE_KEYS_REV[cat.key]
        if (shortKey) ids[shortKey] = comp.id
      }
    }
    const encoded = btoa(JSON.stringify(ids)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return `${window.location.origin}${window.location.pathname}#build=${encoded}`
  }

  function loadBuildFromUrl(hash) {
    if (!hash) return false
    const match = hash.match(/#build=(.+)/)
    if (!match) return false
    try {
      const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/')
      const ids = JSON.parse(atob(b64))
      const comps = {}
      for (const [shortKey, presetId] of Object.entries(ids)) {
        let cat = SHARE_KEYS[shortKey]
        if (cat) {
          const list = presets[cat] || []
          const found = list.find(p => p.id === presetId)
          if (found) comps[cat] = { ...found, category: cat }
        } else if (shortKey === 'a') {
          // Legacy 'antenna' key — try vtxAntenna first, then rxAntenna
          const vtxList = presets.vtxAntenna || []
          const rxList = presets.rxAntenna || []
          const inVtx = vtxList.find(p => p.id === presetId)
          const inRx = rxList.find(p => p.id === presetId)
          if (inVtx) comps.vtxAntenna = { ...inVtx, category: 'vtxAntenna' }
          else if (inRx) comps.rxAntenna = { ...inRx, category: 'rxAntenna' }
        }
      }
      if (Object.keys(comps).length === 0) return false
      const store = useBuildStore()
      store.loadBuild({ name: 'Shared Build', components: comps })
      return true
    } catch {
      return false
    }
  }

  async function copyShareUrl() {
    const url = generateShareUrl()
    await navigator.clipboard.writeText(url)
    return url
  }

  async function copyShoppingList() {
    const store = useBuildStore()
    let lines = [`## Shopping List — ${store.buildName}`, '', '| Part | Component | Price |', '|---|---|---|']
    let total = 0
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (!comp) continue
      const isMultiplied = comp.category === 'motors'
      const price = comp.cost ? (isMultiplied ? comp.cost * 4 : comp.cost) : 0
      total += price
      const priceStr = comp.cost ? `${formatCurrency(price)}${isMultiplied ? ' (x4)' : ''}` : '—'
      lines.push(`| ${cat.label} | ${comp.name} | ${priceStr} |`)
    }
    lines.push(`| **Total** | | **${formatCurrency(total)}** |`)
    lines.push('', `*Generated by QuadCalc — ${new Date().toLocaleDateString()}*`)
    const text = lines.join('\n')
    await navigator.clipboard.writeText(text)
    return text
  }

  // Settings
  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }

  // Custom presets (user-added components, persisted in localStorage)
  function getCustomPresets() {
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function saveCustomPreset(category, component) {
    const presets = getCustomPresets()
    if (!presets[category]) presets[category] = []
    // Ensure unique ID
    if (!component.id) {
      component.id = 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    }
    component._custom = true
    // Don't add duplicates
    const exists = presets[category].find(p => p.id === component.id)
    if (!exists) {
      presets[category].push(component)
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
    }
    return component
  }

  function deleteCustomPreset(category, componentId) {
    const presets = getCustomPresets()
    if (presets[category]) {
      presets[category] = presets[category].filter(p => p.id !== componentId)
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
    }
  }

  loadSavedBuilds()

  return {
    savedBuilds,
    loadSavedBuilds,
    saveBuild,
    loadBuild,
    deleteBuild,
    exportBuildToFile,
    exportBuildToCsv,
    importBuildFromFile,
    copyShoppingList,
    generateShareUrl,
    loadBuildFromUrl,
    copyShareUrl,
    getSettings,
    saveSettings,
    getCustomPresets,
    saveCustomPreset,
    deleteCustomPreset,
  }
}
