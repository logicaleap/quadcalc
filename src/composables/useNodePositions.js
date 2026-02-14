import { reactive } from 'vue'

const STORAGE_KEY = 'quadcalc_node_positions'

// Shared state across all consumers
const overrides = reactive(new Map())

// Load from localStorage on module init
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    const entries = JSON.parse(raw)
    for (const [key, pos] of entries) {
      overrides.set(key, pos)
    }
  }
} catch { /* ignore corrupt data */ }

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...overrides.entries()]))
  } catch { /* localStorage full or unavailable */ }
}

export function useNodePositions() {
  function getPosition(key, defaultX, defaultY) {
    const o = overrides.get(key)
    return o ? { x: o.x, y: o.y } : { x: defaultX, y: defaultY }
  }

  function setPosition(key, x, y) {
    overrides.set(key, { x, y })
    persist()
  }

  function resetPositions() {
    overrides.clear()
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const hasOverrides = () => overrides.size > 0

  return { getPosition, setPosition, resetPositions, hasOverrides, overrides }
}
