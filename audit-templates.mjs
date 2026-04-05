// audit-templates.mjs
import { presets } from './src/data/presets.js'
import { templates } from './src/data/templates.js'
import { compatibilityRules } from './src/data/compatibilityRules.js'

// Flatten presets into a lookup by ID
const presetById = {}
for (const [category, items] of Object.entries(presets)) {
  for (const item of items) {
    presetById[item.id] = { ...item, category }
  }
}

for (const tpl of templates) {
  console.log(`\n=== ${tpl.name} ===`)
  
  // Resolve preset IDs
  const resolved = {}
  let missing = false
  for (const [cat, id] of Object.entries(tpl.presetIds)) {
    const preset = presetById[id]
    if (!preset) {
      console.log(`  MISSING PRESET: ${cat} → ${id}`)
      missing = true
    } else {
      resolved[cat] = preset
    }
  }
  
  if (missing) continue
  
  // Run compatibility rules
  let issues = 0
  for (const rule of compatibilityRules) {
    const [catA, catB] = rule.categories
    const a = resolved[catA]
    const b = resolved[catB]
    if (!a || !b) continue
    
    const msg = rule.check(a, b)
    if (msg) {
      console.log(`  [${rule.severity.toUpperCase()}] ${rule.name}: ${msg}`)
      issues++
    }
  }
  
  if (issues === 0) {
    console.log(`  ✓ No compatibility issues`)
  }
  
  // Also print key specs for verification
  console.log(`  --- Key specs ---`)
  if (resolved.frame) console.log(`  Frame: ${resolved.frame.name} (size: ${resolved.frame.specs?.size}")`)
  if (resolved.motors) console.log(`  Motors: ${resolved.motors.name} (stator: ${resolved.motors.specs?.size}, KV: ${resolved.motors.specs?.kv}, voltage: ${resolved.motors.specs?.voltage}, shaft: ${resolved.motors.specs?.shaftSize})`)
  if (resolved.propellers) console.log(`  Props: ${resolved.propellers.name} (size: ${resolved.propellers.specs?.size}", shaft: ${resolved.propellers.specs?.shaftSize})`)
  if (resolved.battery) console.log(`  Battery: ${resolved.battery.name} (voltage: ${resolved.battery.specs?.voltage}, capacity: ${resolved.battery.specs?.capacity}mAh)`)
  if (resolved.fc) console.log(`  FC: ${resolved.fc.name} (mount: ${resolved.fc.specs?.mountPattern}mm, voltage: ${resolved.fc.specs?.voltage})`)
  if (resolved.esc) console.log(`  ESC: ${resolved.esc.name} (mount: ${resolved.esc.specs?.mountPattern}mm, voltage: ${resolved.esc.specs?.voltage}, current: ${resolved.esc.specs?.current}A)`)
  if (resolved.vtx) console.log(`  VTX: ${resolved.vtx.name} (system: ${resolved.vtx.specs?.system})`)
  if (resolved.camera) console.log(`  Camera: ${resolved.camera.name} (system: ${resolved.camera.specs?.system})`)
  if (resolved.rx) console.log(`  RX: ${resolved.rx.name} (protocol: ${resolved.rx.specs?.protocol})`)
  if (resolved.tx) console.log(`  TX: ${resolved.tx.name} (protocol: ${resolved.tx.specs?.protocol})`)
  if (resolved.goggles) console.log(`  Goggles: ${resolved.goggles.name} (system: ${resolved.goggles.specs?.system})`)
}
