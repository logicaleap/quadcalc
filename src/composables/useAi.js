import { ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from './useCompatibility.js'
import { useStorage } from './useStorage.js'
import { CATEGORIES } from '../utils/helpers.js'

export function useAi() {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)

  function buildContext() {
    const store = useBuildStore()
    const { alerts, compatibilityScore } = useCompatibility()

    const parts = ['Current FPV Quadcopter Build:']
    for (const cat of CATEGORIES) {
      const comp = store.components[cat.key]
      if (comp) {
        parts.push(`- ${cat.label}: ${comp.name} (${comp.description || 'no description'})`)
        if (comp.specs) {
          const specStr = Object.entries(comp.specs)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('/') : v}`)
            .join(', ')
          parts.push(`  Specs: ${specStr}`)
        }
      } else {
        parts.push(`- ${cat.label}: (not selected)`)
      }
    }

    parts.push(`\nCompatibility Score: ${compatibilityScore.value}%`)

    if (alerts.value.length > 0) {
      parts.push('\nCompatibility Issues:')
      for (const alert of alerts.value) {
        parts.push(`- [${alert.severity.toUpperCase()}] ${alert.name}: ${alert.message}`)
      }
    } else {
      parts.push('\nNo compatibility issues detected.')
    }

    return parts.join('\n')
  }

  async function sendMessage(userMessage) {
    const { getSettings } = useStorage()
    const settings = getSettings()

    if (!settings.apiKey) {
      error.value = 'Please set your OpenRouter API key in Settings.'
      return
    }

    error.value = null
    messages.value.push({ role: 'user', content: userMessage })
    loading.value = true

    const systemPrompt = `You are QuadCalc AI, an expert FPV drone building assistant. You help users pick compatible components for their quadcopter builds. You know about:
- Frame sizes (3", 5", 7") and which components match
- Motor stator sizes, KV ratings, and appropriate propellers
- Battery voltage (S count), connectors, and capacity
- Video systems (Analog, DJI, HDZero, Walksnail) — camera, VTX, and goggles must match
- Radio protocols (ELRS, Crossfire, FrSky, FlySky) — TX and RX must match
- Flight controllers, ESCs, mounting patterns, and voltage ratings
- General FPV building best practices

Be concise but thorough. If you see compatibility issues, explain WHY they're problems and suggest fixes. If the user asks for suggestions, recommend specific components that work with their current build. Assume the user may be a beginner and explain jargon when used.`

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here is my current build state:\n\n${buildContext()}\n\n---\n\nUser question: ${userMessage}` },
      ...messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
    ]

    try {
      const model = settings.model || 'google/gemini-2.0-flash-001'

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'QuadCalc FPV Builder',
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          max_tokens: 1024,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`API error ${res.status}: ${errBody}`)
      }

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'No response received.'

      messages.value.push({ role: 'assistant', content: reply })
    } catch (err) {
      error.value = err.message
      messages.value.push({ role: 'assistant', content: `Error: ${err.message}` })
    } finally {
      loading.value = false
    }
  }

  function clearChat() {
    messages.value = []
    error.value = null
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
  }
}
