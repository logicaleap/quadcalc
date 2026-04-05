import { computed } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'

/**
 * Fixed-wing performance calculations.
 * These replace the quad's TWR/flight-time calculations when in FW mode.
 */
export function useFwPerformance() {
  const store = useBuildStore()

  // Wing loading = AUW / wing area (g/dm²)
  const wingLoading = computed(() => {
    const frame = store.fwComponents?.fwFrame
    if (!frame?.specs?.wingArea || !store.fwTotalWeight) return null
    return store.fwTotalWeight / frame.specs.wingArea
  })

  // Wing loading classification
  const wingLoadingTag = computed(() => {
    const wl = wingLoading.value
    if (wl == null) return ''
    if (wl < 20) return 'ULTRA-LIGHT'
    if (wl < 40) return 'TRAINER'
    if (wl < 70) return 'SPORT'
    if (wl < 100) return 'FAST'
    return 'RACER'
  })

  const wingLoadingClass = computed(() => {
    const wl = wingLoading.value
    if (wl == null) return ''
    if (wl < 70) return 'wl-good'
    if (wl < 100) return 'wl-warn'
    return 'wl-bad'
  })

  // Stall speed estimate (km/h)
  // V_stall ≈ 4.0 × sqrt(wing_loading_g_per_dm2)
  // Assumes CL_max ≈ 1.3 for typical FPV wing airfoils
  const stallSpeed = computed(() => {
    const wl = wingLoading.value
    if (wl == null) return null
    return 4.0 * Math.sqrt(wl)
  })

  // Cruise speed estimate (km/h)
  // Typically 1.8× stall speed for efficient cruise
  const cruiseSpeed = computed(() => {
    const vs = stallSpeed.value
    if (vs == null) return null
    return vs * 1.8
  })

  // Thrust-to-weight ratio for fixed wing
  // Uses single motor thrust (not ×4 like quad)
  const fwThrustToWeight = computed(() => {
    const motor = store.fwComponents?.motors
    if (!motor?.specs?.thrust_grams || !store.fwTotalWeight) return null
    // Single motor, 80% of peak thrust
    return (motor.specs.thrust_grams * 0.8) / store.fwTotalWeight
  })

  // FW thrust classification (much lower than quad)
  const fwThrustTag = computed(() => {
    const tw = fwThrustToWeight.value
    if (tw == null) return ''
    if (tw >= 1.0) return 'OVERPOWERED'
    if (tw >= 0.7) return 'SPORT'
    if (tw >= 0.5) return 'CRUISE'
    if (tw >= 0.3) return 'EFFICIENT'
    return 'UNDERPOWERED'
  })

  const fwThrustClass = computed(() => {
    const tw = fwThrustToWeight.value
    if (tw == null) return ''
    if (tw >= 0.5) return 'tw-good'
    if (tw >= 0.3) return 'tw-warn'
    return 'tw-bad'
  })

  // Flight time estimate for fixed wing
  // Much longer than quad because wings generate lift aerodynamically
  // Power_cruise ≈ (AUW_kg × 9.81 × V_cruise_m_s) / (L_D × eta_prop)
  // L/D ratio depends on airframe type
  const estimatedFlightTime = computed(() => {
    const battery = store.fwComponents?.battery
    const frame = store.fwComponents?.fwFrame
    if (!battery?.specs?.capacity || !store.fwTotalWeight) return null

    const cells = parseInt(battery.specs.voltage) || 4
    const nominalVoltage = cells * 3.7
    const batteryWh = (battery.specs.capacity / 1000) * nominalVoltage

    const auwKg = store.fwTotalWeight / 1000
    const vCruise = (cruiseSpeed.value || 50) / 3.6 // km/h to m/s

    // L/D ratio based on airframe type
    const frameType = frame?.specs?.type
    let liftToDrag
    if (frameType === 'flying-wing') {
      liftToDrag = 8 // flying wings have moderate L/D
    } else {
      liftToDrag = 12 // conventional planes have better L/D
    }

    const etaProp = 0.6 // propeller efficiency
    const cruisePowerW = (auwKg * 9.81 * vCruise) / (liftToDrag * etaProp)

    if (cruisePowerW <= 0) return null

    // Usable capacity (80%) converted to hours then minutes
    const flightTimeHours = (batteryWh * 0.8) / cruisePowerW
    return flightTimeHours * 60
  })

  // Format helpers
  const formattedWingLoading = computed(() => {
    if (wingLoading.value == null) return '—'
    return `${wingLoading.value.toFixed(1)} g/dm²`
  })

  const formattedStallSpeed = computed(() => {
    if (stallSpeed.value == null) return '—'
    return `${Math.round(stallSpeed.value)} km/h`
  })

  const formattedCruiseSpeed = computed(() => {
    if (cruiseSpeed.value == null) return '—'
    return `~${Math.round(cruiseSpeed.value)} km/h`
  })

  const formattedFwTwr = computed(() => {
    if (fwThrustToWeight.value == null) return '—'
    return `${fwThrustToWeight.value.toFixed(2)}:1`
  })

  const formattedFlightTime = computed(() => {
    if (estimatedFlightTime.value == null) return '—'
    const mins = Math.round(estimatedFlightTime.value)
    if (mins >= 60) return `~${(mins / 60).toFixed(1)} hr`
    return `~${mins} min`
  })

  return {
    wingLoading,
    wingLoadingTag,
    wingLoadingClass,
    stallSpeed,
    cruiseSpeed,
    fwThrustToWeight,
    fwThrustTag,
    fwThrustClass,
    estimatedFlightTime,
    formattedWingLoading,
    formattedStallSpeed,
    formattedCruiseSpeed,
    formattedFwTwr,
    formattedFlightTime,
  }
}
