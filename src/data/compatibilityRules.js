/**
 * Compatibility rules for FPV quadcopter components.
 * Each rule checks a pair of component categories and returns warnings/errors.
 *
 * Rule format: { id, name, description, categories: [catA, catB], severity: 'error'|'warning'|'info', check(a, b) => string|null }
 * - check returns a message string if incompatible, null if OK
 * - a and b are the component objects from the respective categories
 */

// Helper: parse voltage string like "4-6S" → { min: 4, max: 6 }
function parseVoltage(v) {
  if (!v) return null
  const m = String(v).match(/(\d+)-?(\d+)?S/)
  if (!m) return null
  return { min: parseInt(m[1]), max: m[2] ? parseInt(m[2]) : parseInt(m[1]) }
}

// Helper: parse S-count like "6S" → 6
function parseSCount(v) {
  if (!v) return null
  const m = String(v).match(/(\d+)S/)
  return m ? parseInt(m[1]) : null
}

// Helper: check voltage overlap
function voltageOverlap(a, b) {
  if (!a || !b) return true
  return a.max >= b.min && b.max >= a.min
}

export const compatibilityRules = [
  // ═══════════════════════════════════════════════════
  // FRAME ↔ PROPELLERS: Size must match
  // ═══════════════════════════════════════════════════
  {
    id: 'frame-prop-size',
    name: 'Frame ↔ Prop Size',
    description: 'Frame size must match propeller size. A 5" frame fits 5" props, 3" frame fits 3" props, etc.',
    categories: ['frame', 'propellers'],
    severity: 'error',
    check(frame, prop) {
      if (frame.specs?.size && prop.specs?.size && frame.specs.size !== prop.specs.size)
        return `Frame is ${frame.specs.size}" but props are ${prop.specs.size}". They must match — ${frame.specs.size}" frame needs ${frame.specs.size}" propellers.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // MOTOR ↔ PROPELLERS: Shaft size must match
  // ═══════════════════════════════════════════════════
  {
    id: 'motor-prop-shaft',
    name: 'Motor ↔ Prop Shaft',
    description: 'Motor shaft diameter must match prop mounting hole. Most 5" use M5 shafts, 3" use M2 or T-mount.',
    categories: ['motors', 'propellers'],
    severity: 'error',
    check(motor, prop) {
      if (motor.specs?.shaftSize && prop.specs?.shaftSize && motor.specs.shaftSize !== prop.specs.shaftSize)
        return `Motor has ${motor.specs.shaftSize} shaft but props need ${prop.specs.shaftSize} shaft. Props won't mount on motors.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // MOTOR ↔ FRAME: Motor size appropriate for frame
  // ═══════════════════════════════════════════════════
  {
    id: 'motor-frame-size',
    name: 'Motor ↔ Frame Size',
    description: 'Motor stator size should match frame size class. 5" frames typically use 2205-2307 motors, 3" use 1303-1507, 7" use 2806+.',
    categories: ['motors', 'frame'],
    severity: 'warning',
    check(motor, frame) {
      if (!motor.specs?.size || !frame.specs?.size) return null
      const stator = parseInt(motor.specs.size)
      const frameSize = frame.specs.size

      const sizeRanges = {
        '3': { min: 1103, max: 1507, label: '1103-1507' },
        '5': { min: 2205, max: 2407, label: '2205-2407' },
        '7': { min: 2505, max: 2908, label: '2505-2908' },
      }
      const range = sizeRanges[frameSize]
      if (range && (stator < range.min || stator > range.max))
        return `Motor ${motor.specs.size} is unusual for a ${frameSize}" frame. Typical motors for ${frameSize}" are ${range.label} stator size.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // FC ↔ FRAME: Mount pattern must match
  // ═══════════════════════════════════════════════════
  {
    id: 'fc-frame-mount',
    name: 'FC ↔ Frame Mount Pattern',
    description: 'Flight controller mounting holes must match the frame. Standard sizes: 30.5x30.5mm (5"+) or 25.5x25.5mm (3"/mini).',
    categories: ['fc', 'frame'],
    severity: 'error',
    check(fc, frame) {
      if (fc.specs?.mountPattern && frame.specs?.mountPattern && fc.specs.mountPattern !== frame.specs.mountPattern)
        return `FC mount is ${fc.specs.mountPattern}mm but frame takes ${frame.specs.mountPattern}mm. FC won't fit in the frame without an adapter.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // ESC ↔ FRAME: Mount pattern must match
  // ═══════════════════════════════════════════════════
  {
    id: 'esc-frame-mount',
    name: 'ESC ↔ Frame Mount Pattern',
    description: 'ESC mounting holes must match the frame stack. Typically same as FC mount pattern.',
    categories: ['esc', 'frame'],
    severity: 'error',
    check(esc, frame) {
      if (esc.specs?.mountPattern && frame.specs?.mountPattern && esc.specs.mountPattern !== frame.specs.mountPattern)
        return `ESC mount is ${esc.specs.mountPattern}mm but frame takes ${frame.specs.mountPattern}mm. ESC won't fit in the frame stack.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // BATTERY ↔ ESC: Voltage rating
  // ═══════════════════════════════════════════════════
  {
    id: 'battery-esc-voltage',
    name: 'Battery ↔ ESC Voltage',
    description: 'Battery cell count must be within the ESC voltage rating. Exceeding it can destroy the ESC.',
    categories: ['battery', 'esc'],
    severity: 'error',
    check(battery, esc) {
      const batS = parseSCount(battery.specs?.voltage)
      const escV = parseVoltage(esc.specs?.voltage)
      if (batS && escV && (batS < escV.min || batS > escV.max))
        return `Battery is ${battery.specs.voltage} but ESC supports ${esc.specs.voltage}. This will damage the ESC!`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // BATTERY ↔ FC: Voltage rating
  // ═══════════════════════════════════════════════════
  {
    id: 'battery-fc-voltage',
    name: 'Battery ↔ FC Voltage',
    description: 'Battery cell count must be within the FC voltage rating. Too many cells can fry the FC.',
    categories: ['battery', 'fc'],
    severity: 'error',
    check(battery, fc) {
      const batS = parseSCount(battery.specs?.voltage)
      const fcV = parseVoltage(fc.specs?.voltage)
      if (batS && fcV && (batS < fcV.min || batS > fcV.max))
        return `Battery is ${battery.specs.voltage} but FC supports ${fc.specs.voltage}. Voltage mismatch — risk of damage!`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // BATTERY ↔ MOTORS: Voltage compatibility
  // ═══════════════════════════════════════════════════
  {
    id: 'battery-motor-voltage',
    name: 'Battery ↔ Motor Voltage',
    description: 'Battery cell count should be within motor voltage rating. Running motors outside rated voltage affects performance and lifespan.',
    categories: ['battery', 'motors'],
    severity: 'warning',
    check(battery, motor) {
      const batS = parseSCount(battery.specs?.voltage)
      const motorV = parseVoltage(motor.specs?.voltage)
      if (batS && motorV && (batS < motorV.min || batS > motorV.max))
        return `Battery is ${battery.specs.voltage} but motors are rated for ${motor.specs.voltage}. Motors may not perform correctly.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // VTX ↔ CAMERA: Video system must match
  // ═══════════════════════════════════════════════════
  {
    id: 'vtx-camera-system',
    name: 'VTX ↔ Camera System',
    description: 'VTX and camera must use the same video system (Analog, DJI, HDZero, or Walksnail). They are not cross-compatible.',
    categories: ['vtx', 'camera'],
    severity: 'error',
    check(vtx, camera) {
      if (vtx.specs?.system && camera.specs?.system && vtx.specs.system !== camera.specs.system)
        return `VTX is ${vtx.specs.system} but camera is ${camera.specs.system}. They must use the same video system — ${vtx.specs.system} VTX needs a ${vtx.specs.system} camera.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // VTX ↔ GOGGLES: Video system must match
  // ═══════════════════════════════════════════════════
  {
    id: 'vtx-goggles-system',
    name: 'VTX ↔ Goggles System',
    description: 'VTX and goggles must use the same video system. DJI VTX → DJI Goggles, Analog VTX → Analog Goggles, etc.',
    categories: ['vtx', 'goggles'],
    severity: 'error',
    check(vtx, goggles) {
      if (vtx.specs?.system && goggles.specs?.system && vtx.specs.system !== goggles.specs.system)
        return `VTX is ${vtx.specs.system} but goggles are ${goggles.specs.system}. You won't get video! VTX and goggles must match.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // CAMERA ↔ GOGGLES: Video system must match
  // ═══════════════════════════════════════════════════
  {
    id: 'camera-goggles-system',
    name: 'Camera ↔ Goggles System',
    description: 'Camera and goggles must use the same video system for the whole video chain to work.',
    categories: ['camera', 'goggles'],
    severity: 'error',
    check(camera, goggles) {
      if (camera.specs?.system && goggles.specs?.system && camera.specs.system !== goggles.specs.system)
        return `Camera is ${camera.specs.system} but goggles are ${goggles.specs.system}. The entire video chain (Camera → VTX → Goggles) must use the same system.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // RX ↔ TX: Radio protocol must match
  // ═══════════════════════════════════════════════════
  {
    id: 'rx-tx-protocol',
    name: 'RX ↔ TX Protocol',
    description: 'Receiver and transmitter must use the same radio protocol (ELRS, Crossfire, FrSky, FlySky). They cannot communicate otherwise.',
    categories: ['rx', 'tx'],
    severity: 'error',
    check(rx, tx) {
      if (rx.specs?.protocol && tx.specs?.protocol && rx.specs.protocol !== tx.specs.protocol)
        return `Receiver is ${rx.specs.protocol} but transmitter is ${tx.specs.protocol}. They can't communicate — both must use the same protocol (e.g., both ELRS or both Crossfire).`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // ESC ↔ FC: Protocol support
  // ═══════════════════════════════════════════════════
  {
    id: 'esc-fc-protocol',
    name: 'ESC ↔ FC Protocol',
    description: 'ESC and FC must share at least one compatible motor protocol (DShot600, DShot300, etc.).',
    categories: ['esc', 'fc'],
    severity: 'warning',
    check(esc, fc) {
      if (!esc.specs?.protocol || !fc.specs?.protocol) return null
      const escP = Array.isArray(esc.specs.protocol) ? esc.specs.protocol : [esc.specs.protocol]
      const fcP = Array.isArray(fc.specs.protocol) ? fc.specs.protocol : [fc.specs.protocol]
      const shared = escP.filter(p => fcP.includes(p))
      if (shared.length === 0)
        return `ESC supports ${escP.join('/')} but FC supports ${fcP.join('/')}. No shared motor protocol — ESC may not respond to FC commands.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // ESC ↔ FC: Mount pattern (stack compatibility)
  // ═══════════════════════════════════════════════════
  {
    id: 'esc-fc-mount',
    name: 'ESC ↔ FC Stack Mount',
    description: 'ESC and FC should have the same mount pattern so they stack together cleanly.',
    categories: ['esc', 'fc'],
    severity: 'warning',
    check(esc, fc) {
      if (esc.specs?.mountPattern && fc.specs?.mountPattern && esc.specs.mountPattern !== fc.specs.mountPattern)
        return `ESC mount is ${esc.specs.mountPattern}mm but FC is ${fc.specs.mountPattern}mm. They won't stack together neatly.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // BATTERY ↔ FRAME: Connector size hint
  // ═══════════════════════════════════════════════════
  {
    id: 'battery-frame-size',
    name: 'Battery ↔ Frame Size',
    description: 'Small batteries (XT30/3-4S low capacity) suit 3" builds; larger batteries (XT60/5-6S) suit 5"+ builds.',
    categories: ['battery', 'frame'],
    severity: 'info',
    check(battery, frame) {
      const frameSize = frame.specs?.size
      const connector = battery.specs?.connector
      if (frameSize === '3' && connector === 'XT60')
        return `XT60 batteries are quite large for a 3" build. Consider an XT30 connector battery for better fit and less weight.`
      if ((frameSize === '5' || frameSize === '7') && connector === 'XT30')
        return `XT30 batteries are typically underpowered for ${frameSize}" builds. Most ${frameSize}" quads use XT60 connector batteries.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // MOTOR ↔ ESC: Current rating
  // ═══════════════════════════════════════════════════
  {
    id: 'motor-esc-current',
    name: 'Motor ↔ ESC Current',
    description: 'ESC per-motor current rating should handle the motors. Rule of thumb: ESC should handle more than the motor peak draw.',
    categories: ['motors', 'esc'],
    severity: 'info',
    check(motor, esc) {
      // Simple heuristic: larger motors on low-rated ESCs
      if (!motor.specs?.size || !esc.specs?.current) return null
      const stator = parseInt(motor.specs.size)
      const escA = esc.specs.current
      if (stator >= 2205 && escA < 30)
        return `Motors (${motor.specs.size}) are full-size but ESC is only ${escA}A per motor. Consider 35A+ for safety margin.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // FC ↔ ESC: AIO redundant ESC warning
  // ═══════════════════════════════════════════════════
  {
    id: 'fc-esc-aio',
    name: 'AIO FC ↔ Standalone ESC',
    description: 'AIO flight controllers include an integrated ESC. Adding a standalone ESC is usually redundant.',
    categories: ['fc', 'esc'],
    severity: 'warning',
    check(fc, esc) {
      if (fc.specs?.aio && !esc._aioVirtual)
        return `Your AIO FC already includes an ESC. The standalone ESC is redundant unless you need higher current.`
      return null
    },
  },

  // ═══════════════════════════════════════════════════
  // VTX ↔ VTX ANTENNA: Connector type must match
  // ═══════════════════════════════════════════════════
  {
    id: 'vtx-vtxAntenna-connector',
    name: 'VTX ↔ VTX Antenna Connector',
    description: 'VTX and VTX antenna RF connectors must match (SMA, MMCX, UFL, RP-SMA). Mismatched connectors need adapters that add weight and signal loss.',
    categories: ['vtx', 'vtxAntenna'],
    severity: 'warning',
    check(vtx, antenna) {
      if (!vtx.specs?.connector || !antenna.specs?.connector) return null
      const vtxConn = vtx.specs.connector
      const antConn = antenna.specs.connector
      if (vtxConn === antConn) return null
      const smaFamily = new Set(['SMA', 'RP-SMA'])
      if (smaFamily.has(vtxConn) && smaFamily.has(antConn))
        return `VTX has ${vtxConn} but VTX antenna is ${antConn}. You'll need a simple SMA↔RP-SMA adapter — cheap and minimal signal loss.`
      return `VTX has ${vtxConn} but VTX antenna is ${antConn}. You'll need a ${vtxConn}↔${antConn} adapter pigtail, which adds weight and signal loss.`
    },
  },

  // ═══════════════════════════════════════════════════
  // RX ↔ RX ANTENNA: Frequency band must match
  // ═══════════════════════════════════════════════════
  {
    id: 'rx-rxAntenna-frequency',
    name: 'RX ↔ RX Antenna Frequency',
    description: 'Receiver and RX antenna must operate on the same frequency band (2.4GHz, 900MHz, 868MHz). Mismatched frequencies mean no signal.',
    categories: ['rx', 'rxAntenna'],
    severity: 'error',
    check(rx, antenna) {
      if (!rx.specs?.frequency || !antenna.specs?.frequency) return null
      const rxFreq = rx.specs.frequency
      const antFreq = antenna.specs.frequency
      // Normalize dual-band RX frequencies (e.g. "868/915MHz" matches "868MHz")
      const rxFreqs = rxFreq.split('/').map(f => f.replace(/\s/g, ''))
      const antFreqs = antFreq.split('/').map(f => f.replace(/\s/g, ''))
      // Check if any frequency overlaps
      const hasOverlap = rxFreqs.some(rf => antFreqs.some(af => rf === af))
      if (hasOverlap) return null
      return `Receiver operates on ${rxFreq} but RX antenna is ${antFreq}. The antenna must match the receiver's frequency band.`
    },
  },
]

/**
 * Explain compatibility for beginners — a map of simple explanations
 * for each checked relationship.
 */
export const compatibilityExplanations = {
  'frame-prop-size': 'Propellers must physically fit within the frame arms. Frame sizes (3", 5", 7") define the maximum propeller diameter.',
  'motor-prop-shaft': 'The propeller center hole must match the motor shaft. M5 (5mm) is standard for 5"+ quads, M2 (2mm) for tiny whoops and 3" builds.',
  'motor-frame-size': 'Larger frames carry heavier loads and need larger motors for enough thrust. Using the wrong motor size causes poor performance or even danger.',
  'fc-frame-mount': 'Flight controllers mount to the frame via standard hole patterns. The two common sizes are 30.5x30.5mm (full-size, 5"+) and 25.5x25.5mm (mini, 3").',
  'esc-frame-mount': 'ESCs stack under/over the flight controller using the same mounting pattern as the frame.',
  'battery-esc-voltage': 'LiPo batteries are rated in cell count (S). Each cell is ~3.7V. If you use a battery with more cells than the ESC supports, you\'ll fry the ESC.',
  'battery-fc-voltage': 'Same as ESC — the flight controller has a maximum voltage. Exceeding it destroys the FC.',
  'battery-motor-voltage': 'Motors have a recommended voltage range. Too low = not enough power. Too high = overheating and reduced lifespan.',
  'vtx-camera-system': 'FPV video systems (Analog, DJI, HDZero, Walksnail) are closed ecosystems. The camera, VTX, and goggles MUST all be the same system.',
  'vtx-goggles-system': 'Your goggles receive the video signal from the VTX. Different systems use incompatible transmission methods.',
  'camera-goggles-system': 'The camera feeds into the VTX which transmits to goggles. All three must match.',
  'rx-tx-protocol': 'Your transmitter (controller) talks to the receiver on the quad via a specific radio protocol. Both must use the same protocol (ELRS, Crossfire, FrSky, etc.).',
  'esc-fc-protocol': 'The FC tells the ESC how fast to spin each motor using a digital protocol like DShot. Both must support at least one common protocol.',
  'esc-fc-mount': 'The ESC and FC are typically stacked together. Matching mount patterns make assembly much easier.',
  'battery-frame-size': 'Small frames need small, light batteries. Large frames need powerful batteries for adequate flight time.',
  'motor-esc-current': 'The ESC current rating must exceed the motor\'s peak current draw. Underpowered ESCs can overheat and fail mid-flight.',
  'fc-esc-aio': 'AIO (All-in-One) flight controllers have the ESC built onto the same board. Adding a separate standalone ESC is redundant unless you specifically need higher current capacity than the integrated one provides.',
  'vtx-vtxAntenna-connector': 'VTX and its antenna connect via an RF connector. Common types are SMA, RP-SMA, MMCX, and UFL. Mismatched connectors require adapter pigtails that add weight, bulk, and signal loss. SMA↔RP-SMA adapters are simple screw-on and cause minimal loss.',
  'rx-rxAntenna-frequency': 'The receiver antenna must operate on the same frequency band as the receiver. ELRS 2.4GHz receivers need a 2.4GHz antenna, 900MHz receivers need a 900MHz antenna, Crossfire uses 868MHz, etc. Using the wrong frequency band means no signal reception.',
}
