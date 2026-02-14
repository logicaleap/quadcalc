import { ref } from 'vue'

const STORAGE_KEY = 'quadcalc_theme'

// Singleton state shared across all consumers
const isDark = ref(true)

function applyTheme() {
  const html = document.documentElement
  if (isDark.value) {
    html.classList.remove('light-theme')
  } else {
    html.classList.add('light-theme')
  }
}

function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    isDark.value = stored === 'dark'
  } else {
    // Respect OS preference on first visit
    isDark.value = !window.matchMedia('(prefers-color-scheme: light)').matches
  }
  applyTheme()
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  applyTheme()
}

export function useTheme() {
  return { isDark, initTheme, toggleTheme }
}
