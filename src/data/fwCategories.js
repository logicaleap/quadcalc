// Fixed-wing component categories
// Shared categories use the same presets as quad builds
// FW-specific categories have their own preset arrays in fwPresets.js

export const FW_CATEGORIES = [
  { key: 'fwFrame', label: 'Airframe', icon: 'frame' },
  { key: 'motors', label: 'Motor', icon: 'motors' },          // shared presets, single motor
  { key: 'fwProp', label: 'Propeller', icon: 'propellers' },
  { key: 'battery', label: 'Battery', icon: 'battery' },       // shared presets
  { key: 'servo', label: 'Servos', icon: 'other' },
  { key: 'fwEsc', label: 'ESC', icon: 'esc' },
  { key: 'fc', label: 'Flight Controller', icon: 'fc' },       // shared presets
  { key: 'gps', label: 'GPS', icon: 'other' },
  { key: 'vtx', label: 'VTX', icon: 'vtx' },                  // shared presets
  { key: 'vtxAntenna', label: 'VTX Antenna', icon: 'antenna' },// shared presets
  { key: 'camera', label: 'Camera', icon: 'camera' },          // shared presets
  { key: 'rx', label: 'Receiver (RX)', icon: 'rx' },           // shared presets
  { key: 'rxAntenna', label: 'RX Antenna', icon: 'antenna' },  // shared presets
  { key: 'tx', label: 'Transmitter (TX)', icon: 'tx' },        // shared presets
  { key: 'goggles', label: 'Goggles', icon: 'goggles' },       // shared presets
]

export const FW_CATEGORY_MAP = Object.fromEntries(FW_CATEGORIES.map(c => [c.key, c]))

// Categories where weight is NOT counted (ground equipment)
export const FW_GROUND_CATEGORIES = new Set(['tx', 'goggles'])

// FW-specific category color overrides (new categories)
export const FW_CATEGORY_COLORS = {
  fwFrame: '#00f0ff',
  servo: '#ff6d00',
  fwEsc: '#ff6d00',
  fwProp: '#7c4dff',
  gps: '#76ff03',
}
