import { ref } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'
import { useCompatibility } from './useCompatibility.js'
import { useStorage } from './useStorage.js'
import { CATEGORIES, CATEGORY_MAP } from '../utils/helpers.js'
import { presets } from '../data/presets.js'

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_presets',
      description: 'Search the preset component database by category and query string. Returns top 10 matching components with id, name, cost, weight, and specs. Use this when the user asks about available components or wants suggestions.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: CATEGORIES.map(c => c.key),
            description: 'Component category to search in',
          },
          query: {
            type: 'string',
            description: 'Search query — matches against name, description, and spec values (e.g. "5 inch", "DJI", "ELRS", "2306")',
          },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_component',
      description: 'Assign a preset component to the build by its preset ID. The component will immediately appear in the build diagram.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: CATEGORIES.map(c => c.key),
            description: 'Component category',
          },
          preset_id: {
            type: 'string',
            description: 'The preset ID to assign (from search_presets results)',
          },
        },
        required: ['category', 'preset_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_component',
      description: 'Remove/clear a component from the build by category.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: CATEGORIES.map(c => c.key),
            description: 'Component category to clear',
          },
        },
        required: ['category'],
      },
    },
  },
]

function searchPresets(category, query) {
  const items = presets[category]
  if (!items) return { error: `Unknown category: ${category}`, count: 0, results: [] }

  if (!query) {
    return {
      count: items.length,
      results: items.slice(0, 10).map(summarizePreset),
    }
  }

  const q = query.toLowerCase()
  const matches = items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q) ||
    Object.values(item.specs || {}).some(v => String(v).toLowerCase().includes(q))
  )

  return {
    count: matches.length,
    results: matches.slice(0, 10).map(summarizePreset),
  }
}

function summarizePreset(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    cost_cents: item.cost,
    cost_display: item.cost ? `$${(item.cost / 100).toFixed(2)}` : null,
    weight_grams: item.weight,
    specs: item.specs,
  }
}

function executeToolCall(toolCall, store) {
  try {
    const args = JSON.parse(toolCall.function.arguments)
    const fnName = toolCall.function.name

    if (fnName === 'search_presets') {
      return searchPresets(args.category, args.query)
    }

    if (fnName === 'set_component') {
      const { category, preset_id } = args
      const items = presets[category]
      if (!items) return { error: `Unknown category: ${category}` }
      const preset = items.find(p => p.id === preset_id)
      if (!preset) return { error: `Preset not found: ${preset_id}` }
      store.setComponent(category, preset)
      const label = CATEGORY_MAP[category]?.label || category
      return { success: true, message: `Set ${label} to ${preset.name}` }
    }

    if (fnName === 'remove_component') {
      const { category } = args
      store.clearComponent(category)
      const label = CATEGORY_MAP[category]?.label || category
      return { success: true, message: `Removed ${label} from build` }
    }

    return { error: `Unknown function: ${fnName}` }
  } catch (err) {
    return { error: `Tool execution error: ${err.message}` }
  }
}

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
    const store = useBuildStore()
    const { getSettings } = useStorage()
    const settings = getSettings()

    if (!settings.apiKey) {
      error.value = 'Please set your OpenRouter API key in Settings.'
      return
    }

    error.value = null
    messages.value.push({ role: 'user', content: userMessage })
    loading.value = true

    const systemPrompt = `You are QuadCalc AI, an expert FPV drone building assistant. You help users pick compatible components for their quadcopter builds.

You have tools to search the component database and directly modify the user's build. USE THEM when the user asks you to add, change, or suggest components. Don't just describe components — actually search for them and assign them.

When a user asks to "add a motor" or "set up a 5 inch build", use search_presets to find options, then use set_component to assign the best match (or ask the user to choose if there are multiple good options).

You know about:
- Frame sizes (3", 5", 7") and which components match
- Motor stator sizes, KV ratings, and appropriate propellers
- Battery voltage (S count), connectors, and capacity
- Video systems (Analog, DJI, HDZero, Walksnail) — camera, VTX, and goggles must match
- Radio protocols (ELRS, Crossfire, FrSky, FlySky) — TX and RX must match
- Flight controllers, ESCs, mounting patterns, and voltage ratings
- General FPV building best practices

Be concise but thorough. If you see compatibility issues, explain WHY they're problems and suggest fixes. Assume the user may be a beginner and explain jargon when used.`

    // Build conversation history for the API (only user/assistant messages)
    const conversationHistory = messages.value.slice(0, -1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Here is my current build state:\n\n${buildContext()}\n\n---\n\nUser question: ${userMessage}` },
      ...conversationHistory,
    ]

    const MAX_ROUNDS = 5

    try {
      const model = settings.model || 'google/gemini-2.0-flash-001'

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const isLastRound = round === MAX_ROUNDS - 1

        const requestBody = {
          model,
          messages: apiMessages,
          max_tokens: 1024,
        }

        // Include tools unless it's the last round (force text response)
        if (!isLastRound) {
          requestBody.tools = TOOL_DEFINITIONS
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'QuadCalc FPV Builder',
          },
          body: JSON.stringify(requestBody),
        })

        if (!res.ok) {
          const errBody = await res.text()
          throw new Error(`API error ${res.status}: ${errBody}`)
        }

        const data = await res.json()
        const choice = data.choices?.[0]
        const msg = choice?.message

        if (!msg) throw new Error('No response received.')

        const toolCalls = msg.tool_calls

        // If there are tool calls, execute them and loop
        if (toolCalls && toolCalls.length > 0) {
          // Push the assistant message with tool_calls into API history
          apiMessages.push({
            role: 'assistant',
            content: msg.content || null,
            tool_calls: toolCalls,
          })

          for (const tc of toolCalls) {
            const result = executeToolCall(tc, store)

            // Push tool result into API history
            apiMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            })

            // Push action messages to UI for set/remove actions
            const fnName = tc.function.name
            if (fnName === 'set_component' && result.success) {
              messages.value.push({
                role: 'action',
                content: result.message,
                actionType: 'set',
              })
            } else if (fnName === 'remove_component' && result.success) {
              messages.value.push({
                role: 'action',
                content: result.message,
                actionType: 'remove',
              })
            }
          }

          // Continue the loop to let the model respond to tool results
          continue
        }

        // No tool calls — just a text response. Done.
        const reply = msg.content || 'No response received.'
        messages.value.push({ role: 'assistant', content: reply })
        break
      }
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
