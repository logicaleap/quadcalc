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

// Quantity needed per build (most parts ×1; you fly 4 motors; props sell as sets of 4)
export function quantityFor(category) {
  if (category === 'motors') return { count: 4, multiplyPrice: true, note: '×4' }
  if (category === 'propellers') return { count: 4, multiplyPrice: false, note: 'set of 4' }
  return { count: 1, multiplyPrice: false, note: '' }
}

// Best-effort "find this part" search link (no vendor URLs in the dataset)
export function partSearchUrl(name) {
  return 'https://www.google.com/search?q=' + encodeURIComponent(`${name} fpv`)
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

// iMessage/iOS truncates URLs that contain an unbroken base64 segment > ~300
// chars. Inserting a '.' every 280 chars breaks it into shorter segments — '.'
// isn't in the base64url alphabet, so it's stripped cleanly on decode.
// (Same approach proven in the p2pbg project.)
const IMESSAGE_CHUNK = 280
function chunkForImessage(b64url) {
  if (b64url.length <= IMESSAGE_CHUNK) return b64url
  const chunks = []
  for (let i = 0; i < b64url.length; i += IMESSAGE_CHUNK) {
    chunks.push(b64url.slice(i, i + IMESSAGE_CHUNK))
  }
  return chunks.join('.')
}

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

  function downloadFile(filename, text, mime) {
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function safeFileName() {
    const store = useBuildStore()
    return (store.buildName || 'quadcalc-build').replace(/[^a-z0-9]/gi, '_')
  }

  // --- String builders (shared by preview, copy, and download) ---

  function buildJsonString() {
    const store = useBuildStore()
    return JSON.stringify(store.exportBuild(), null, 2)
  }

  function buildCsvString() {
    const store = useBuildStore()
    const rows = [['Category', 'Component', 'Qty', 'Description', 'Cost', 'Weight', 'Specs', 'Search']]
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (comp) {
        const qty = quantityFor(comp.category)
        const linePrice = comp.cost != null ? (qty.multiplyPrice ? comp.cost * qty.count : comp.cost) : null
        const specsStr = comp.specs
          ? Object.entries(comp.specs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('/') : v}`).join('; ')
          : ''
        rows.push([
          cat.label,
          comp.name,
          qty.note || '1',
          comp.description || '',
          formatCurrency(linePrice),
          formatWeight(comp.weight),
          specsStr,
          partSearchUrl(comp.name),
        ])
      } else {
        rows.push([cat.label, '(empty)', '', '', '', '', '', ''])
      }
    }
    rows.push([])
    rows.push(['TOTAL', '', '', '', formatCurrency(store.totalCost), formatWeight(store.totalWeight), '', ''])
    rows.push(['Build Name', store.buildName])
    rows.push(['Parts', `${store.filledCount} / ${CATEGORIES.length}`])
    return rows.map(r => r.map(csvCell).join(',')).join('\n')
  }

  function buildShoppingMarkdown({ links = true } = {}) {
    const store = useBuildStore()
    const lines = [
      `## Shopping List — ${store.buildName}`,
      '',
      '| Part | Component | Qty | Price |',
      '|---|---|---|---|',
    ]
    let total = 0
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (!comp) continue
      const qty = quantityFor(comp.category)
      const price = comp.cost != null ? (qty.multiplyPrice ? comp.cost * qty.count : comp.cost) : 0
      total += price
      const name = links ? `[${comp.name}](${partSearchUrl(comp.name)})` : comp.name
      const priceStr = comp.cost != null ? formatCurrency(price) : '—'
      lines.push(`| ${cat.label} | ${name} | ${qty.note || '1'} | ${priceStr} |`)
    }
    lines.push(`| **Total** | | | **${formatCurrency(total)}** |`)
    lines.push('', `*Generated by QuadCalc — ${new Date().toLocaleDateString()}*`)
    return lines.join('\n')
  }

  function exportBuildToFile() {
    downloadFile(`${safeFileName()}.json`, buildJsonString(), 'application/json')
  }

  function exportBuildToCsv() {
    downloadFile(`${safeFileName()}.csv`, buildCsvString(), 'text/csv')
  }

  function exportShoppingListToFile() {
    downloadFile(`${safeFileName()}.md`, buildShoppingMarkdown(), 'text/markdown')
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
    return `${window.location.origin}${window.location.pathname}#build=${chunkForImessage(encoded)}`
  }

  function loadBuildFromUrl(hash) {
    if (!hash) return false
    const match = hash.match(/#build=(.+)/)
    if (!match) return false
    try {
      // Strip any '.' chunk separators (iMessage-safe encoding), then base64url-decode
      let b64 = match[1].replace(/\./g, '').replace(/-/g, '+').replace(/_/g, '/')
      while (b64.length % 4) b64 += '='
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
    const text = buildShoppingMarkdown()
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

  function updateCustomPreset(category, componentId, updates) {
    const all = getCustomPresets()
    const list = all[category]
    if (!list) return
    const idx = list.findIndex(p => p.id === componentId)
    if (idx === -1) return
    const { id: _id, ...safe } = updates
    all[category][idx] = { ...all[category][idx], ...safe, _custom: true }
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(all))
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
    exportShoppingListToFile,
    buildJsonString,
    buildCsvString,
    buildShoppingMarkdown,
    importBuildFromFile,
    copyShoppingList,
    generateShareUrl,
    loadBuildFromUrl,
    copyShareUrl,
    getSettings,
    saveSettings,
    getCustomPresets,
    saveCustomPreset,
    updateCustomPreset,
    deleteCustomPreset,
  }
}
