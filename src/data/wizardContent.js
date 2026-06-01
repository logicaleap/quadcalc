// Beginner-facing explainer content for the Guided Build wizard.
// One entry per build step (keyed by category). Each card demystifies the
// part — including, where relevant, why it's *named* the way it is.
// Shape: { whatItIs, whyItMatters, lookFor: [{ label, note }], rookieTip }

export const wizardContent = {
  frame: {
    whatItIs: 'The skeleton of your drone. Everything bolts onto it — motors on the arms, electronics stacked in the middle.',
    whyItMatters: "Pick this first — it sets the whole build. A frame is named after the propeller size it spins: a 5\" frame takes 5\" props, the freestyle standard — tough, repairable, parts everywhere. That single choice then drives your motors, battery and more.",
    lookFor: [
      { label: 'Size', note: '5" = do-everything starter' },
      { label: 'Arm thickness', note: 'thicker carbon survives crashes' },
      { label: 'Mount pattern', note: 'remember this number — your FC must match' },
    ],
    rookieTip: "A 30.5×30.5mm mount is the full-size standard. Mixing it with a 25.5mm board is the #1 “why won't it fit?” mistake — so I'll only show you parts that fit as we go. ✅",
  },

  motors: {
    whatItIs: 'The four spinning powerhouses on the arms. They turn battery power into thrust.',
    whyItMatters: 'Motors are named by their stator size — a number like 2207 means 22mm wide × 07mm tall, and bigger = more torque. The other number is KV (rpm per volt). KV pairs with your battery’s voltage, counted in cells written as “S”: a 4S pack is 4 cells, 6S is 6 — more cells means more voltage and more speed. So high-voltage 6S builds use lower-KV motors, while 4S builds use higher-KV.',
    lookFor: [
      { label: 'Stator size', note: '2207 is the 5" sweet spot' },
      { label: 'KV', note: '~1800KV for 6S, ~2400KV for 4S' },
      { label: 'Voltage (S)', note: 'must match your battery' },
    ],
    rookieTip: "You fly four motors but the price is per motor — I've already ×4'd it in your running total. KV and battery cell count must agree, or you'll over- or under-spin.",
  },

  propellers: {
    whatItIs: "The propellers — “props” for short — are the blades that bite the air. Cheap and consumable; you'll break plenty while learning.",
    whyItMatters: 'Props are sized to your frame: a 5" frame takes 5" props. A label like 5x4.3x3 means 5" diameter, 4.3" pitch (how far it screws forward per spin), 3 blades. More pitch or blades = more thrust, but more current draw and heat.',
    lookFor: [
      { label: 'Diameter', note: 'match your frame size' },
      { label: 'Pitch', note: 'higher = faster, hotter motors' },
      { label: 'Blades', note: '3 is the freestyle default' },
    ],
    rookieTip: 'Buy a big bag — props are the first thing to snap. They sell in sets, so your total reflects a set of 4.',
  },

  battery: {
    whatItIs: 'The fuel tank — a LiPo (lithium-polymer) pack that dumps huge current to the motors.',
    whyItMatters: 'Named by cell count (S) and capacity (mAh). The S sets your voltage — more cells = more punch. mAh is the tank size: bigger flies longer but weighs more. The C-rating is how fast it can safely discharge.',
    lookFor: [
      { label: 'Cells (S)', note: 'must match motors & ESC' },
      { label: 'Capacity (mAh)', note: '1300 is the 5" standard' },
      { label: 'C-rating', note: 'higher sustains hard throttle' },
    ],
    rookieTip: 'Voltage is the #1 thing to get right: a 6S battery on 4S-only gear is an expensive bang. I’m filtering to packs your motors accept.',
  },

  fc: {
    whatItIs: 'The flight controller (FC) is the brain. It reads your radio and the gyro, then tells each motor how fast to spin.',
    whyItMatters: "It mounts to the frame on the hole pattern you noted (30.5 or 25.5mm). Many beginner boards are “AIO” (all-in-one) — ESC, video transmitter, even the receiver baked in — which means fewer parts and less soldering.",
    lookFor: [
      { label: 'Mount pattern', note: 'must match your frame' },
      { label: 'Processor', note: 'F7/H7 = headroom for features' },
      { label: 'AIO?', note: 'bundles ESC/VTX/RX — simpler build' },
    ],
    rookieTip: "Pick an AIO and I'll auto-fill the parts it includes, so you can skip those steps. The mount pattern must match your frame — I'm enforcing it.",
  },

  esc: {
    whatItIs: "The ESC — Electronic Speed Controller — is the muscle driver: it takes the brain's commands and delivers raw battery current to the motors.",
    whyItMatters: 'Rated in amps (A) — the continuous current it can push. Match it to your motors’ appetite and your battery voltage. On most builds it stacks under the flight controller on the same mount pattern.',
    lookFor: [
      { label: 'Amp rating', note: '45A+ for 5"; more = safer headroom' },
      { label: 'Voltage (S)', note: 'must cover your battery' },
      { label: 'Mount', note: 'matches the frame/FC stack' },
    ],
    rookieTip: "If you chose an AIO flight controller, the ESC is already included — I've filled it in and you can skip this step. ✅",
  },

  vtx: {
    whatItIs: "The VTX — Video Transmitter — beams the camera feed to your goggles, like a live “TV station” on your drone.",
    whyItMatters: 'It must speak the same video language as your camera and goggles: Analog (cheap, universal) or a digital HD system (DJI, HDZero, Walksnail). Power in mW sets range; higher runs hotter.',
    lookFor: [
      { label: 'Video system', note: 'must match camera & goggles' },
      { label: 'Power (mW)', note: 'higher = more range' },
      { label: 'Size', note: 'fits the stack/frame' },
    ],
    rookieTip: "Camera + VTX + goggles are a trio — all three must be the same system. Mixing analog and digital shows no picture, so I'm keeping them matched.",
  },

  vtxAntenna: {
    whatItIs: 'The little antenna that radiates your video signal to the goggles. It screws onto your VTX (video transmitter).',
    whyItMatters: 'Tuned to the video band (usually 5.8GHz). The connector type (SMA / MMCX / U.FL) must match your VTX. A good antenna does more for range than raw power.',
    lookFor: [
      { label: 'Frequency', note: '5.8GHz for analog & most HD' },
      { label: 'Connector', note: 'match your VTX (SMA/MMCX/U.FL)' },
      { label: 'Polarization', note: 'RHCP is the common default' },
    ],
    rookieTip: 'Cheap insurance: a snapped or wrong-connector antenna kills your video. Match the connector to the VTX you picked.',
  },

  camera: {
    whatItIs: 'Your eyes in the sky — the FPV (first-person view) camera streams live video to the VTX (video transmitter).',
    whyItMatters: 'Must match your video system (analog vs digital HD). Analog cams are tiny and cheap; digital cams pair with their own ecosystem (DJI/HDZero/Walksnail). Sensor size drives low-light quality.',
    lookFor: [
      { label: 'Video system', note: 'must match VTX & goggles' },
      { label: 'Sensor', note: 'bigger handles light better' },
      { label: 'Size', note: '19mm / Nano / Micro fit' },
    ],
    rookieTip: "Stay inside one video family — an analog camera can't feed DJI goggles. I'm filtering to cameras that match your system.",
  },

  rx: {
    whatItIs: 'The RX — receiver — is the drone’s ear: it picks up the control signals from the radio in your hands.',
    whyItMatters: 'Must run the same radio protocol as your transmitter — ELRS is the modern, cheap, long-range favorite. Some AIO flight controllers include the receiver already.',
    lookFor: [
      { label: 'Protocol', note: 'ELRS is the popular default' },
      { label: 'Frequency', note: '2.4GHz (most) or 915MHz (long range)' },
      { label: 'Diversity', note: 'two antennas = fewer dropouts' },
    ],
    rookieTip: "RX and TX must speak the same protocol or they'll never bind. If your FC is AIO with a built-in RX, I've filled this in — skip ahead.",
  },

  rxAntenna: {
    whatItIs: 'The thin wire antenna that picks up your control link — it plugs into your RX (receiver).',
    whyItMatters: "Tuned to your receiver's frequency (2.4GHz or 915MHz). Placement and an intact tip matter more than price — a damaged antenna is the top cause of mysterious “failsafes.”",
    lookFor: [
      { label: 'Frequency', note: 'match your receiver (2.4GHz/915MHz)' },
      { label: 'Connector', note: 'usually U.FL / IPEX' },
      { label: 'Length', note: 'matches the band' },
    ],
    rookieTip: 'Never fly with a chewed-up antenna tip — it silently halves your range. Match the frequency to your receiver.',
  },

  tx: {
    whatItIs: 'The TX — transmitter, or “radio” — is the controller in your hands: sticks, switches, and the link that flies the quad.',
    whyItMatters: "Gear you keep across many builds, so buy decent. It must run a protocol your receiver speaks (ELRS radios pair with ELRS receivers). It doesn't fly, so it isn't counted in your drone's weight.",
    lookFor: [
      { label: 'Protocol', note: 'match your receiver (ELRS, etc.)' },
      { label: 'Form factor', note: 'full-size vs compact gamepad' },
      { label: 'Gimbals', note: 'hall-effect last longer' },
    ],
    rookieTip: "Your radio outlives your drones — spend a little more here. It's ground gear, so I leave it out of the flying-weight total.",
  },

  goggles: {
    whatItIs: 'The headset that puts you in the cockpit — your live video display.',
    whyItMatters: 'Must match your video system (analog vs DJI/HDZero/Walksnail). Like the radio, goggles are a long-term purchase you reuse across builds. They’re ground gear, not part of the drone’s weight.',
    lookFor: [
      { label: 'Video system', note: 'must match camera & VTX' },
      { label: 'Resolution', note: 'higher = crisper HD image' },
      { label: 'FOV / size', note: 'comfort and immersion' },
    ],
    rookieTip: "Goggles are the priciest reusable — and they lock you into a video system, so choose the system first. Not counted in flying weight.",
  },
}
