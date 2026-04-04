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

// Migrate old 'antenna' key to vtxAntenna/rxAntenna based on frequency
function migrateAntennaKey(comps) {
  if (!comps || !comps.antenna) return comps
  const ant = comps.antenna
  const freq = ant.specs?.frequency
  if (freq === '5.8GHz') {
    if (!comps.vtxAntenna) comps.vtxAntenna = { ...ant, category: 'vtxAntenna' }
  } else {
    if (!comps.rxAntenna) comps.rxAntenna = { ...ant, category: 'rxAntenna' }
  }
  delete comps.antenna
  return comps
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

  // Ground equipment excluded from weight (they don't fly on the quad)
  const GROUND_CATEGORIES = new Set(['tx', 'goggles'])

  const totalWeight = computed(() =>
    Object.values(components.value).reduce((sum, c) => {
      if (!c?.weight || GROUND_CATEGORIES.has(c.category)) return sum
      if (c.category === 'motors' || c.category === 'propellers') return sum + c.weight * 4
      return sum + c.weight
    }, 0)
  )

  const weightBreakdown = computed(() => {
    const breakdown = {}
    for (const cat of CATEGORIES) {
      if (GROUND_CATEGORIES.has(cat.key)) { breakdown[cat.key] = 0; continue }
      const c = components.value[cat.key]
      if (!c?.weight) { breakdown[cat.key] = 0; continue }
      breakdown[cat.key] = (c.category === 'motors' || c.category === 'propellers') ? c.weight * 4 : c.weight
    }
    breakdown.total = Object.values(breakdown).reduce((s, v) => s + v, 0)
    return breakdown
  })

  const costBreakdown = computed(() => {
    const breakdown = {}
    for (const cat of CATEGORIES) {
      const c = components.value[cat.key]
      if (!c?.cost) { breakdown[cat.key] = 0; continue }
      breakdown[cat.key] = c.category === 'motors' ? c.cost * 4 : c.cost
    }
    breakdown.total = Object.values(breakdown).reduce((s, v) => s + v, 0)
    return breakdown
  })

  // Map motor stator size → typical prop size (inches)
  const MOTOR_TYPICAL_PROP = {
    '0702': 1.6, '0802': 1.6, '0803': 1.6,
    '1102': 2.5, '1103': 2.5, '1104': 2.5,
    '1204': 3, '1303': 3,
    '1404': 3, '1408': 3,
    '1504': 3.5, '1505': 3.5, '1506': 3.5, '1507': 3.5,
    '2004': 5, '2005': 5, '2006': 3.5,
    '2105': 5, '2203': 3.5,
    '2207': 5, '2208': 5,
    '2306': 5,
    '2405': 5, '2407': 6,
    '2506': 6, '2806': 7, '2807': 7, '2809': 7,
    '2812': 8,
  }

  const propMatchStatus = computed(() => {
    const motor = components.value.motors
    const prop = components.value.propellers
    if (!motor?.specs?.size || !prop?.specs?.size) return null
    const typicalPropSize = MOTOR_TYPICAL_PROP[motor.specs.size]
    if (!typicalPropSize) return null
    let propSize = parseFloat(prop.specs.size) || 0
    // Convert mm props to inches (whoop props listed as "40mm", "31mm")
    if (String(prop.specs.size).toLowerCase().includes('mm') || propSize > 15) {
      propSize = propSize / 25.4
    }
    if (propSize < 0.5) return null
    const ratio = propSize / typicalPropSize
    if (ratio > 1.15) return 'oversized'
    if (ratio < 0.85) return 'undersized'
    return 'typical'
  })

  const thrustToWeightRatio = computed(() => {
    const motor = components.value.motors
    if (!motor?.specs?.thrust_grams || !totalWeight.value) return null
    // thrust_grams is measured at motor's max rated voltage.
    // Scale by (battery voltage / motor max voltage)² since thrust ∝ RPM² ∝ V²
    let thrustPerMotor = motor.specs.thrust_grams
    const battery = components.value.battery
    if (battery?.specs?.voltage && motor.specs.voltage) {
      const batCells = parseInt(battery.specs.voltage) || 0
      // Motor voltage is like "4-6S" or "6S" — use the max
      const motorMaxCells = parseInt(motor.specs.voltage.split('-').pop()) || 0
      if (batCells > 0 && motorMaxCells > 0 && batCells < motorMaxCells) {
        const voltageRatio = batCells / motorMaxCells
        thrustPerMotor = thrustPerMotor * voltageRatio * voltageRatio
      }
    }
    // Use 80% of peak static thrust for realistic effective TWR
    return (thrustPerMotor * 4 * 0.8) / totalWeight.value
  })

  const estimatedFlightTime = computed(() => {
    const battery = components.value.battery
    if (!battery?.specs?.capacity || !totalWeight.value) return null
    // Scale average power draw by frame class
    const frameSize = components.value.frame?.specs?.size
    const s = parseFloat(frameSize) || 5
    const cells = parseInt(battery.specs.voltage) || 4
    let wattsPerKg
    if (cells <= 2) wattsPerKg = 300             // Tiny Whoop (1-2S): high throttle % to hover
    else if (s <= 3.5) wattsPerKg = 300          // 3" Cinewhoop: ducted props need more power
    else if (s <= 5) wattsPerKg = 350            // 5" Freestyle: punchy throttle
    else if (s <= 7) wattsPerKg = 180            // 7" Long Range: efficiency cruising
    else wattsPerKg = 160                        // 10"+ Cinelifter: slow and steady
    const nominalVoltage = cells * 3.7
    const avgPowerW = (totalWeight.value / 1000) * wattsPerKg
    const avgCurrentA = avgPowerW / nominalVoltage
    // Flight time with 80% usable capacity
    return (battery.specs.capacity * 0.8) / (avgCurrentA * 1000) * 60
  })

  function handleAioEsc(fcComponent) {
    const esc = components.value.esc
    if (fcComponent && fcComponent.specs?.aio) {
      // Only auto-fill if ESC is empty or already a virtual AIO ESC
      if (!esc || esc._aioVirtual) {
        components.value.esc = {
          id: 'esc-aio-virtual',
          name: `Included in ${fcComponent.name}`,
          description: 'ESC integrated into AIO flight controller',
          cost: 0,
          weight: 0,
          category: 'esc',
          _aioVirtual: true,
          specs: {
            voltage: fcComponent.specs.voltage,
            protocol: fcComponent.specs.protocol,
            mountPattern: fcComponent.specs.mountPattern,
          },
        }
      }
    } else {
      // FC cleared or changed to non-AIO — remove virtual ESC only
      if (esc?._aioVirtual) {
        components.value.esc = null
      }
    }
  }

  function handleAioVtx(fcComponent) {
    const vtx = components.value.vtx
    if (fcComponent && fcComponent.specs?.aioVtx) {
      if (!vtx || vtx._aioVirtual) {
        components.value.vtx = {
          id: 'vtx-aio-virtual',
          name: `Included in ${fcComponent.name}`,
          description: 'VTX integrated into AIO flight controller',
          cost: 0, weight: 0, category: 'vtx',
          _aioVirtual: true,
          specs: {
            system: fcComponent.specs.vtxSystem,
            power: fcComponent.specs.vtxPower,
            voltage: fcComponent.specs.voltage,
            connector: fcComponent.specs.vtxConnector,
          },
        }
      }
    } else {
      if (vtx?._aioVirtual) components.value.vtx = null
    }
  }

  function handleAioRx(fcComponent) {
    const rx = components.value.rx
    if (fcComponent && fcComponent.specs?.aioRx) {
      if (!rx || rx._aioVirtual) {
        components.value.rx = {
          id: 'rx-aio-virtual',
          name: `Included in ${fcComponent.name}`,
          description: 'SPI receiver integrated into AIO flight controller',
          cost: 0, weight: 0, category: 'rx',
          _aioVirtual: true,
          specs: {
            protocol: fcComponent.specs.rxProtocol,
            frequency: fcComponent.specs.rxFrequency,
            telemetry: true,
          },
        }
      }
    } else {
      if (rx?._aioVirtual) components.value.rx = null
    }
  }

  function setComponent(category, component) {
    pushUndo()
    if (component) {
      components.value[category] = { ...component, category }
    } else {
      components.value[category] = null
    }
    if (category === 'fc') {
      handleAioEsc(components.value.fc)
      handleAioVtx(components.value.fc)
      handleAioRx(components.value.fc)
    }
  }

  function clearComponent(category) {
    pushUndo()
    components.value[category] = null
    if (category === 'fc') { handleAioEsc(null); handleAioVtx(null); handleAioRx(null) }
    if (category === 'esc') handleAioEsc(components.value.fc)
    if (category === 'vtx') handleAioVtx(components.value.fc)
    if (category === 'rx') handleAioRx(components.value.fc)
  }

  function clearAll() {
    pushUndo()
    Object.keys(components.value).forEach(k => { components.value[k] = null })
    buildName.value = 'Untitled Build'
  }

  function loadBuild(build) {
    pushUndo()
    buildName.value = build.name || 'Loaded Build'
    const comps = migrateAntennaKey(build.components || {})
    Object.keys(components.value).forEach(k => {
      components.value[k] = comps[k] || null
    })
    handleAioEsc(components.value.fc)
    handleAioVtx(components.value.fc)
    handleAioRx(components.value.fc)
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
      const draftComps = migrateAntennaKey(draft.components)
      buildName.value = draft.name || 'Untitled Build'
      Object.keys(components.value).forEach(k => {
        components.value[k] = draftComps[k] || null
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
    weightBreakdown,
    costBreakdown,
    thrustToWeightRatio,
    propMatchStatus,
    estimatedFlightTime,
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
