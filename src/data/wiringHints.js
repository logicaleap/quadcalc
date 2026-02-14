export const wiringHints = [
  { categories: ['fc', 'esc'], hint: 'Connect ESC signal wire to FC motor outputs (M1-M4). If 4-in-1 ESC, use 8-pin ribbon cable or solder pads.' },
  { categories: ['fc', 'rx'], hint: 'Connect RX to a spare UART on the FC (TX\u2192RX, RX\u2192TX). ELRS receivers typically need a single UART.' },
  { categories: ['fc', 'vtx'], hint: 'Connect VTX to a UART TX pad for SmartAudio/Tramp control. Power from VBAT or 9V pad depending on VTX voltage rating.' },
  { categories: ['fc', 'camera'], hint: 'Analog camera: connect to FC camera input pad. DJI/HDZero: connect to Air Unit which handles camera signal.' },
  { categories: ['esc', 'motors'], hint: 'Solder 3 motor wires to ESC motor pads. Swap any 2 wires to reverse direction if needed.' },
  { categories: ['battery', 'esc'], hint: 'Battery XT60/XT30 connects to ESC power input. Add capacitor (1000uF low-ESR) across battery pads to reduce voltage spikes.' },
  { categories: ['vtx', 'antenna'], hint: 'Connect antenna to VTX SMA/MMCX/UFL connector. NEVER power VTX without antenna attached \u2014 it will burn out.' },
  { categories: ['rx', 'antenna'], hint: 'Mount RX antenna(s) at 90-degree angles for best reception. Keep away from carbon fiber and ESC noise.' },
]
