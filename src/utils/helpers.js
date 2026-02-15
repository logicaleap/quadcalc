export function formatCurrency(cents, currency = 'USD') {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatWeight(grams) {
  if (grams == null) return '—'
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`
  return `${grams} g`
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const CATEGORIES = [
  { key: 'frame', label: 'Frame', icon: 'frame' },
  { key: 'motors', label: 'Motors', icon: 'motors' },
  { key: 'propellers', label: 'Propellers', icon: 'propellers' },
  { key: 'battery', label: 'Battery', icon: 'battery' },
  { key: 'fc', label: 'Flight Controller', icon: 'fc' },
  { key: 'esc', label: 'ESC', icon: 'esc' },
  { key: 'vtx', label: 'VTX', icon: 'vtx' },
  { key: 'vtxAntenna', label: 'VTX Antenna', icon: 'antenna' },
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'rx', label: 'Receiver (RX)', icon: 'rx' },
  { key: 'rxAntenna', label: 'RX Antenna', icon: 'antenna' },
  { key: 'tx', label: 'Transmitter (TX)', icon: 'tx' },
  { key: 'goggles', label: 'Goggles', icon: 'goggles' },
  { key: 'other', label: 'Other', icon: 'other' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

export function formatTWR(ratio) {
  if (ratio == null) return '—'
  return `${ratio.toFixed(1)}:1`
}
