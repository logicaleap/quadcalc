/**
 * Compatibility rules for fixed-wing FPV builds.
 * Same format as quad compatibilityRules.js.
 * Rules that are identical to quad (video system, radio protocol) are imported from there.
 */

// Helper: parse voltage string like "4-6S" → { min: 4, max: 6 }
function parseVoltage(v) {
  if (!v) return null
  const m = String(v).match(/(\d+)-?(\d+)?S/)
  if (!m) return null
  return { min: parseInt(m[1]), max: m[2] ? parseInt(m[2]) : parseInt(m[1]) }
}

function parseSCount(v) {
  if (!v) return null
  const m = String(v).match(/(\d+)S/)
  return m ? parseInt(m[1]) : null
}

function voltageOverlap(a, b) {
  if (!a || !b) return true
  return a.max >= b.min && b.max >= a.min
}

export const fwCompatibilityRules = [
  // ═══════════════════════════════════════════
  // BATTERY ↔ ESC: Voltage must be compatible
  // ═══════════════════════════════════════════
  {
    id: 'fw-bat-esc-voltage',
    name: 'Battery ↔ ESC Voltage',
    description: 'Battery cell count must be within ESC voltage rating.',
    categories: ['battery', 'fwEsc'],
    severity: 'error',
    check(bat, esc) {
      const batCells = parseSCount(bat.specs?.voltage)
      const escV = parseVoltage(esc.specs?.voltage)
      if (!batCells || !escV) return null
      if (batCells > escV.max) return `Battery is ${bat.specs.voltage} but ESC max is ${escV.max}S. ESC will burn out.`
      if (batCells < escV.min) return `Battery is ${bat.specs.voltage} but ESC min is ${escV.min}S. ESC may not function.`
      return null
    },
  },

  // ═══════════════════════════════════════════
  // PROP TYPE ↔ FRAME: Pusher/tractor must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-prop-frame-type',
    name: 'Prop ↔ Frame Motor Mount',
    description: 'Propeller type (pusher/tractor) should match airframe motor mount configuration.',
    categories: ['fwFrame', 'fwProp'],
    severity: 'warning',
    check(frame, prop) {
      const frameMount = frame.specs?.motorMount
      const propType = prop.specs?.propType
      if (!frameMount || !propType || propType === 'both') return null
      if (frameMount !== propType) return `Airframe uses ${frameMount} motor but propeller is ${propType} type. You need a ${frameMount} propeller.`
      return null
    },
  },

  // ═══════════════════════════════════════════
  // SERVO COUNT ↔ FRAME: Enough servos?
  // ═══════════════════════════════════════════
  {
    id: 'fw-servo-count',
    name: 'Servo ↔ Frame Requirements',
    description: 'Airframe requires a specific number of servos for its control surfaces.',
    categories: ['fwFrame', 'servo'],
    severity: 'info',
    check(frame, servo) {
      const needed = frame.specs?.servoCount
      if (!needed) return null
      const surfaces = frame.specs?.controlSurfaces || 'unknown'
      return `This airframe needs ${needed} servo(s) for ${surfaces} control. Make sure you have the right quantity.`
    },
  },

  // ═══════════════════════════════════════════
  // VTX ↔ CAMERA: Video system must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-vtx-camera-system',
    name: 'VTX ↔ Camera System',
    description: 'VTX and camera must use the same video system (Analog, DJI, HDZero, Walksnail).',
    categories: ['vtx', 'camera'],
    severity: 'error',
    check(vtx, cam) {
      if (!vtx.specs?.system || !cam.specs?.system) return null
      if (vtx.specs.system !== cam.specs.system) return `VTX is ${vtx.specs.system} but camera is ${cam.specs.system}. They must use the same video system.`
      return null
    },
  },

  // ═══════════════════════════════════════════
  // VTX ↔ GOGGLES: Video system must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-vtx-goggles-system',
    name: 'VTX ↔ Goggles System',
    description: 'VTX and goggles must use the same video system.',
    categories: ['vtx', 'goggles'],
    severity: 'error',
    check(vtx, gog) {
      if (!vtx.specs?.system || !gog.specs?.system) return null
      if (vtx.specs.system !== gog.specs.system) return `VTX is ${vtx.specs.system} but goggles are ${gog.specs.system}. You won't get video.`
      return null
    },
  },

  // ═══════════════════════════════════════════
  // TX ↔ RX: Radio protocol must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-tx-rx-protocol',
    name: 'TX ↔ RX Protocol',
    description: 'Transmitter and receiver must use the same radio protocol.',
    categories: ['tx', 'rx'],
    severity: 'error',
    check(tx, rx) {
      const txP = tx.specs?.protocol
      const rxP = rx.specs?.protocol
      if (!txP || !rxP) return null
      const txProts = Array.isArray(txP) ? txP : [txP]
      const rxProts = Array.isArray(rxP) ? rxP : [rxP]
      if (txP === 'Multi') return null // Multi-protocol TX works with anything
      const match = txProts.some(t => rxProts.includes(t))
      if (!match) return `TX uses ${txProts.join('/')} but RX uses ${rxProts.join('/')}. They must use the same protocol.`
      return null
    },
  },

  // ═══════════════════════════════════════════
  // VTX ↔ VTX ANTENNA: Connector must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-vtx-antenna-connector',
    name: 'VTX ↔ VTX Antenna Connector',
    description: 'VTX and antenna RF connector type must match (SMA, MMCX, UFL, RP-SMA).',
    categories: ['vtx', 'vtxAntenna'],
    severity: 'warning',
    check(vtx, ant) {
      if (!vtx.specs?.connector || !ant.specs?.connector) return null
      if (vtx.specs.connector === ant.specs.connector) return null
      return `VTX has ${vtx.specs.connector} but VTX antenna is ${ant.specs.connector}. You'll need an adapter pigtail.`
    },
  },

  // ═══════════════════════════════════════════
  // RX ↔ RX ANTENNA: Frequency must match
  // ═══════════════════════════════════════════
  {
    id: 'fw-rx-antenna-freq',
    name: 'RX ↔ RX Antenna Frequency',
    description: 'Receiver and RX antenna operating frequency must match.',
    categories: ['rx', 'rxAntenna'],
    severity: 'error',
    check(rx, ant) {
      if (!rx.specs?.frequency || !ant.specs?.frequency) return null
      const rxF = rx.specs.frequency
      const antF = ant.specs.frequency
      // Normalize: "2.4GHz/900MHz" contains both
      if (rxF.includes(antF) || antF.includes(rxF)) return null
      // Check for partial overlap
      const rxFreqs = rxF.split('/')
      const antFreqs = antF.split('/')
      const overlap = rxFreqs.some(f => antFreqs.some(a => f.includes(a) || a.includes(f)))
      if (overlap) return null
      return `RX is ${rxF} but RX antenna is ${antF}. Frequencies must match.`
    },
  },
]

// Explanations for each rule (shown when user expands the alert)
export const fwCompatibilityExplanations = {
  'fw-bat-esc-voltage': 'Exceeding the ESC voltage rating will destroy it instantly. Always check the S-count rating.',
  'fw-prop-frame-type': 'Pusher props spin clockwise viewed from the back. Tractor props spin the opposite way. Using the wrong type reduces thrust or causes vibration.',
  'fw-servo-count': 'Flying wings need 2 servos (one per elevon). Conventional planes need 3-4 (ailerons, elevator, rudder). V-tail planes need 2 for the tail plus 1-2 for ailerons.',
  'fw-vtx-camera-system': 'FPV video systems (Analog, DJI, HDZero, Walksnail) are closed ecosystems. Camera, VTX, and goggles MUST all be the same system.',
  'fw-vtx-goggles-system': 'Your goggles receive the video signal from the VTX. Different systems use incompatible transmission methods.',
  'fw-tx-rx-protocol': 'The transmitter and receiver must speak the same radio protocol. ELRS, Crossfire, FrSky, and FlySky are not cross-compatible.',
  'fw-vtx-antenna-connector': 'Common RF connectors: SMA, RP-SMA, MMCX, UFL. Mismatched connectors require adapter pigtails that add weight and signal loss.',
  'fw-rx-antenna-freq': 'The RX antenna must operate on the same frequency as the receiver. 2.4GHz antennas won\'t work with 900MHz receivers.',
}
