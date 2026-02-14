export function formatCurrency(cents, currency = 'USD') {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
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
  { key: 'frame', label: 'Frame', icon: '⬡' },
  { key: 'motors', label: 'Motors', icon: '⚙' },
  { key: 'propellers', label: 'Propellers', icon: '✦' },
  { key: 'battery', label: 'Battery', icon: '⚡' },
  { key: 'fc', label: 'Flight Controller', icon: '◈' },
  { key: 'esc', label: 'ESC', icon: '△' },
  { key: 'vtx', label: 'VTX', icon: '◉' },
  { key: 'camera', label: 'Camera', icon: '◎' },
  { key: 'rx', label: 'Receiver (RX)', icon: '⟡' },
  { key: 'tx', label: 'Transmitter (TX)', icon: '⟐' },
  { key: 'goggles', label: 'Goggles', icon: '◐' },
  { key: 'antenna', label: 'Antenna', icon: '⦿' },
  { key: 'other', label: 'Other', icon: '◆' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))
