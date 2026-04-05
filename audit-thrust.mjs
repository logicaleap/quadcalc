/**
 * audit-thrust.mjs
 *
 * Loads presets and templates, then:
 *  1. Lists ALL motor presets with stator size, KV, voltage, thrust_grams,
 *     and flags any that look unrealistic vs real-world reference data.
 *  2. For each template, resolves preset IDs, calculates per-component weight
 *     (x4 for motors & props), total AUW (excluding tx & goggles), motor thrust,
 *     TWR, and shows the real-world expected TWR range for that class.
 */

import { presets } from './src/data/presets.js';
import { templates } from './src/data/templates.js';

// --- Real-world reference thrust ranges (grams per motor, full throttle) -----
const thrustRef = [
  { size: '0802', kv: 19000, voltage: '1S', lo: 30,  hi: 45   },
  { size: '1404', kv: 3700,  voltage: '4S', lo: 280, hi: 350  },
  { size: '2207', kv: 1855,  voltage: '4S', lo: 1100, hi: 1300 },
  { size: '2207', kv: 1855,  voltage: '6S', lo: 1500, hi: 1700 },
  { size: '2306', kv: 1700,  voltage: '4S', lo: 900,  hi: 1100 },
  { size: '2306', kv: 1700,  voltage: '6S', lo: 1200, hi: 1400 },
  { size: '2806.5', kv: 1300, voltage: '6S', lo: 1400, hi: 1800 },
];

// Generalised reference ranges keyed by stator size
// so we can flag any motor even if not an exact match above.
const statorRanges = {
  '0802': { lo: 25,   hi: 55 },
  '1102': { lo: 40,   hi: 80 },
  '1103': { lo: 50,   hi: 100 },
  '1202': { lo: 50,   hi: 100 },
  '1303': { lo: 100,  hi: 250 },
  '1404': { lo: 200,  hi: 420 },
  '1507': { lo: 350,  hi: 600 },
  '2004': { lo: 400,  hi: 700 },
  '2204': { lo: 500,  hi: 800 },
  '2205': { lo: 700,  hi: 1100 },
  '2206': { lo: 800,  hi: 1200 },
  '2207': { lo: 900,  hi: 1700 },
  '2306': { lo: 800,  hi: 1500 },
  '2405': { lo: 900,  hi: 1400 },
  '2806': { lo: 1200, hi: 1900 },
  '2806.5': { lo: 1200, hi: 1900 },
  '2807': { lo: 1300, hi: 2000 },
};

// Build a flat lookup: id -> preset
const lookup = {};
for (const [category, items] of Object.entries(presets)) {
  for (const item of items) {
    lookup[item.id] = { ...item, category };
  }
}

// ---------------------------------------------------------------------------
// 1. MOTOR AUDIT
// ---------------------------------------------------------------------------
console.log('='.repeat(100));
console.log('  ALL MOTOR PRESETS -- thrust audit');
console.log('='.repeat(100));
console.log('');

const motorList = presets.motors.slice().sort((a, b) => {
  const cmp = a.specs.size.localeCompare(b.specs.size);
  if (cmp !== 0) return cmp;
  return a.specs.kv - b.specs.kv;
});

const header = [
  'ID'.padEnd(30),
  'Name'.padEnd(40),
  'Stator'.padEnd(8),
  'KV'.padStart(7),
  'Voltage'.padEnd(8),
  'Thrust(g)'.padStart(10),
  'Ref Range'.padEnd(14),
  'Status',
].join(' | ');

console.log(header);
console.log('-'.repeat(header.length));

let issueCount = 0;
for (const m of motorList) {
  const { size, kv, voltage, thrust_grams } = m.specs;
  const range = statorRanges[size];
  let refStr = '(no ref)';
  let status = '';
  if (range) {
    refStr = `${range.lo}-${range.hi}g`;
    if (thrust_grams < range.lo * 0.8) {
      status = '*** TOO LOW ***';
      issueCount++;
    } else if (thrust_grams > range.hi * 1.2) {
      status = '*** TOO HIGH ***';
      issueCount++;
    } else if (thrust_grams < range.lo) {
      status = 'low (borderline)';
    } else if (thrust_grams > range.hi) {
      status = 'high (borderline)';
    } else {
      status = 'OK';
    }
  } else {
    status = '(no reference)';
  }

  console.log([
    m.id.padEnd(30),
    m.name.padEnd(40),
    size.padEnd(8),
    String(kv).padStart(7),
    (voltage || '?').padEnd(8),
    String(thrust_grams).padStart(10),
    refStr.padEnd(14),
    status,
  ].join(' | '));
}

console.log('');
console.log(`Total motors: ${motorList.length}`);
console.log(`Issues flagged: ${issueCount}`);
console.log('');

// ---------------------------------------------------------------------------
// 2. TEMPLATE BUILD ANALYSIS
// ---------------------------------------------------------------------------
// Typical real-world TWR ranges by class
const twrExpected = {
  'whoop':    { lo: 2.0, hi: 3.5, label: 'Tiny Whoop (1S-2S)' },
  '3"':       { lo: 3.0, hi: 6.0, label: '3" Cinewhoop / Toothpick' },
  '5"':       { lo: 5.0, hi: 12.0, label: '5" Freestyle / Race' },
  '7"':       { lo: 4.0, hi: 8.0,  label: '7" Long Range' },
  '10"':      { lo: 3.0, hi: 6.0,  label: '10" Long Range' },
};

function classifyBuild(template, framePreset) {
  const name = template.name.toLowerCase();
  if (name.includes('whoop') || name.includes('tiny')) return 'whoop';
  const frameSize = framePreset?.specs?.size || '';
  if (frameSize === '7') return '7"';
  if (frameSize === '10') return '10"';
  if (frameSize === '3' || frameSize.includes('40mm')) {
    return '3"';
  }
  if (frameSize === '5') return '5"';
  return '5"'; // default
}

console.log('='.repeat(100));
console.log('  TEMPLATE BUILD ANALYSIS');
console.log('='.repeat(100));

for (const tpl of templates) {
  console.log('');
  console.log(`--- ${tpl.name} (${tpl.id}) ---`);
  console.log(`    ${tpl.description}`);
  console.log('');

  const components = {};
  const missing = [];

  for (const [cat, presetId] of Object.entries(tpl.presetIds)) {
    const preset = lookup[presetId];
    if (!preset) {
      missing.push(`${cat}: ${presetId}`);
    }
    components[cat] = preset || null;
  }

  if (missing.length) {
    console.log('    *** MISSING PRESETS:');
    for (const m of missing) console.log(`        - ${m}`);
    console.log('');
  }

  // Multiplied categories: motors x4, propellers x4
  const multiplyBy4 = ['motors', 'propellers'];
  const excludeFromAUW = ['tx', 'goggles'];

  let totalAUW = 0;
  console.log('    Component Weights:');
  console.log('    ' + '-'.repeat(70));

  for (const [cat, preset] of Object.entries(components)) {
    if (!preset) {
      console.log(`    ${cat.padEnd(14)}  *** NOT FOUND ***`);
      continue;
    }
    const qty = multiplyBy4.includes(cat) ? 4 : 1;
    const compWeight = preset.weight * qty;
    const excluded = excludeFromAUW.includes(cat);
    const tag = excluded ? '(not in AUW)' : '';
    const qtyStr = qty > 1 ? ` x${qty}` : '    ';

    if (!excluded) totalAUW += compWeight;

    console.log(
      `    ${cat.padEnd(14)} ${String(preset.weight).padStart(5)}g${qtyStr}  = ${String(compWeight).padStart(5)}g  ${tag}  ${preset.name}`
    );
  }

  console.log('    ' + '-'.repeat(70));
  console.log(`    TOTAL AUW (All-Up Weight):  ${totalAUW}g`);

  // TWR calculation
  const motorPreset = components.motors;
  if (motorPreset && motorPreset.specs?.thrust_grams) {
    const thrustPerMotor = motorPreset.specs.thrust_grams;
    const totalThrust = thrustPerMotor * 4;
    const twr = totalThrust / totalAUW;

    console.log('');
    console.log(`    Motor: ${motorPreset.name}`);
    console.log(`    Thrust per motor: ${thrustPerMotor}g`);
    console.log(`    Total thrust (x4): ${totalThrust}g`);
    console.log(`    TWR: ${twr.toFixed(2)}:1`);

    const buildClass = classifyBuild(tpl, components.frame);
    const expected = twrExpected[buildClass];
    if (expected) {
      console.log(`    Expected TWR for ${expected.label}: ${expected.lo}:1 - ${expected.hi}:1`);
      if (twr < expected.lo) {
        console.log(`    *** WARNING: TWR below expected range! Build may feel underpowered.`);
      } else if (twr > expected.hi) {
        console.log(`    *** WARNING: TWR above expected range! Thrust values may be inflated.`);
      } else {
        console.log(`    Status: TWR is within expected range.`);
      }
    }
  } else {
    console.log('');
    console.log('    *** Cannot calculate TWR -- motor preset missing or no thrust_grams.');
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// 3. REFERENCE TABLE
// ---------------------------------------------------------------------------
console.log('='.repeat(100));
console.log('  REAL-WORLD REFERENCE THRUST VALUES');
console.log('='.repeat(100));
console.log('');
console.log('  Stator    | KV     | Voltage | Thrust Range (g/motor)');
console.log('  ----------|--------|---------|----------------------');
for (const r of thrustRef) {
  console.log(`  ${r.size.padEnd(10)}| ${String(r.kv).padStart(6)} | ${r.voltage.padEnd(7)} | ${r.lo}-${r.hi}g`);
}
console.log('');
console.log('Done.');
