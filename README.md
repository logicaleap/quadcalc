# QuadCalc — FPV Build Planner

QuadCalc is a browser-based tool for planning FPV (First Person View) drone builds. It visualizes component relationships on an interactive diagram, checks compatibility between parts, and provides AI-assisted guidance — all without a backend.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## What It Does

- **Interactive Quad Diagram** — 13 component slots arranged radially around a top-down quadcopter SVG. Click any node to browse and select parts.
- **Compatibility Engine** — 16 rule-based checks warn you when parts don't work together (wrong video system, mismatched voltage, incompatible mounting patterns, etc.).
- **AI Chat** — Ask questions about your build using any OpenRouter-compatible model. The AI sees your current build and can suggest parts or diagnose issues.
- **Save/Load/Export** — Save builds to localStorage, export as JSON or CSV, import from JSON files.
- **URL Import** — Paste a product URL from any FPV store and the AI extracts component specs automatically.
- **265+ Built-in Presets** — Pre-populated database of real FPV components across all 13 categories.

## Tech Stack

- **Vite** + **Vue 3** (Composition API, `<script setup>`)
- **Pinia** for state management
- **Tailwind CSS v4** with a custom Tron/cyberpunk theme
- **No backend** — localStorage for persistence, OpenRouter for AI features

## Project Structure

```
src/
├── main.js                          # App entry point
├── App.vue                          # Root component, layout, modals
├── assets/
│   └── main.css                     # Tron theme, glow effects, Tailwind config
├── stores/
│   └── buildStore.js                # Pinia store: build state, components, totals
├── composables/
│   ├── useCompatibility.js          # Rule-based compatibility engine
│   ├── useAi.js                     # OpenRouter API integration
│   └── useStorage.js                # localStorage: saves, settings, custom presets
├── components/
│   ├── QuadDiagram.vue              # Central SVG quad + radial node layout
│   ├── ComponentNode.vue            # Clickable SVG node on diagram
│   ├── ComponentPanel.vue           # Right-side panel: specs, alerts, preset picker
│   ├── ComponentSelector.vue        # Searchable preset browser
│   ├── CompatibilityAlerts.vue      # Bottom-left compatibility warnings
│   ├── BuildSummary.vue             # Top-center: cost, weight, part count, compat %
│   ├── AiChat.vue                   # Floating AI chat panel (OpenRouter)
│   ├── SaveLoadModal.vue            # Save/load/export/import builds
│   ├── SettingsModal.vue            # API key and model configuration
│   ├── UrlImportModal.vue           # AI-powered product URL scanner
│   ├── HelpModal.vue                # Beginner-friendly usage guide
│   └── TronGrid.vue                 # Animated background grid
├── data/
│   ├── presets.js                   # Component database (see below)
│   └── compatibilityRules.js        # Compatibility rule definitions
└── utils/
    └── helpers.js                   # Formatting, categories, constants
```

## Presets Database

The preset database lives in `src/data/presets.js`. It exports a single object with arrays for each of the 13 component categories:

```js
export const presets = {
  frame: [...],
  motors: [...],
  propellers: [...],
  battery: [...],
  fc: [...],          // Flight Controllers
  esc: [...],         // Electronic Speed Controllers
  vtx: [...],         // Video Transmitters
  camera: [...],
  rx: [...],          // Receivers
  tx: [...],          // Transmitters (radios)
  goggles: [...],
  antenna: [...],
  other: [...],       // Accessories, action cameras, tools, etc.
}
```

### Item Format

Every preset follows this shape:

```js
{
  id: 'category-uniquename',           // Unique ID (string)
  name: 'Product Name',                // Display name
  description: 'What this does...',    // Beginner-friendly description
  cost: 3999,                          // Price in cents USD ($39.99)
  weight: 115,                         // Weight in grams
  specs: {                             // Category-specific specs
    // See below for each category's spec keys
  }
}
```

### Category-Specific Specs

| Category | Key Specs |
|----------|-----------|
| `frame` | `size` ("3"/"5"/"7"), `mountPattern` ("25.5x25.5"/"30.5x30.5"), `material`, `wheelbase` |
| `motors` | `size` ("2306"), `kv`, `shaftSize` ("M5"/"M2"), `voltage` ("4-6S"), `mountPattern` |
| `propellers` | `size` ("5"), `pitch`, `blades`, `shaftSize`, `material` |
| `battery` | `voltage` ("6S"), `capacity` (mAh), `cRating`, `connector` ("XT60"/"XT30"), `chemistry` |
| `fc` | `mcu`, `firmware`, `mountPattern`, `voltage`, `uarts`, `protocol` |
| `esc` | `current` (A), `voltage`, `protocol`, `mountPattern`, `blheli` |
| `vtx` | `system` ("Analog"/"DJI"/"HDZero"/"Walksnail"), `power` (mW), `voltage`, `connector` |
| `camera` | `system`, `resolution`, `sensor`, `fov`, `voltage` |
| `rx` | `protocol` ("ELRS"/"Crossfire"/"FrSky"/"FlySky"), `frequency`, `antenna`, `telemetry` |
| `tx` | `protocol`, `frequency`, `channels`, `display`, `gimbal` |
| `goggles` | `system`, `resolution`, `fov`, `dvr`, `diversity` |
| `antenna` | `frequency`, `type` ("RHCP"/"LHCP"), `gain`, `connector` |
| `other` | Freeform — any relevant specs |

### Adding Presets

**In code:** Add items directly to the arrays in `presets.js` following the format above.

**At runtime:** Users can add custom presets via the "Import URL" feature or by selecting "Add to My Presets" after scanning a product. Custom presets are stored in localStorage under `quadcalc_custom_presets` and appear alongside built-in ones.

## Compatibility Rules

Defined in `src/data/compatibilityRules.js`. Each rule specifies which two categories it checks, a validation function, and beginner-friendly error messages. Key rules include:

- Frame size must match prop size
- VTX, camera, and goggles must use the same video system
- RX and TX must use the same radio protocol
- Battery voltage must be within ESC and FC ratings
- Mounting patterns must be compatible between FC/ESC and frame

## Configuration

Click **SETTINGS** in the top bar to configure:

- **OpenRouter API Key** — Required for AI Chat and URL Import features. Get one free at [openrouter.ai](https://openrouter.ai).
- **Model** — Any OpenRouter-compatible model (default: `google/gemini-2.0-flash-001`).

## Build Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## License

MIT
