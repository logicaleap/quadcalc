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

const HELP_TEXT = `**QuadCalc AI** can help you build your FPV drone. Here's what you can ask:

**Add components:**
\`Add a 5 inch frame\`
\`Set up ELRS radio\`
\`Add budget motors for a 5" build\`

**Get suggestions:**
\`What motor should I use?\`
\`Suggest a battery for my build\`
\`What video system is best for beginners?\`

**Check your build:**
\`Is my build compatible?\`
\`What's wrong with my setup?\`
\`What am I missing?\`

**Remove components:**
\`Remove the frame\`
\`Clear the motors\`

**General FPV questions:**
\`What does KV mean?\`
\`Difference between 4S and 6S?\`
\`What is ELRS?\``

function searchPresets(category, query, extraFilters) {
  const items = presets[category]
  if (!items) return { error: `Unknown category: ${category}`, count: 0, results: [] }

  let matches = items

  // Text search via query
  if (query) {
    const q = query.toLowerCase()
    matches = matches.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      Object.values(item.specs || {}).some(v => String(v).toLowerCase().includes(q))
    )
  }

  // Filter by any extra params the model passes (size, kv, voltage, etc.)
  // These match against preset specs — supports exact match and range strings like "1700-2000"
  if (extraFilters && Object.keys(extraFilters).length > 0) {
    matches = matches.filter(item => {
      const specs = item.specs || {}
      for (const [key, filterVal] of Object.entries(extraFilters)) {
        const specVal = specs[key]
        if (specVal == null) continue
        const specStr = String(specVal).toLowerCase()
        const filterStr = String(filterVal).toLowerCase()

        // Range filter: "1700-2000" or "2205-2407"
        const rangeMatch = filterStr.match(/^(\d+)\s*-\s*(\d+)$/)
        if (rangeMatch) {
          const lo = parseInt(rangeMatch[1])
          const hi = parseInt(rangeMatch[2])
          const num = parseInt(specStr)
          if (!isNaN(num) && (num < lo || num > hi)) return false
          continue
        }

        // Exact/substring match
        if (!specStr.includes(filterStr)) return false
      }
      return true
    })
  }

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
      const { category, query, ...extra } = args
      return searchPresets(category, query, extra)
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

// Parse Gemini-style tool_code blocks from text content
// Handles: ```tool_code\n...\n```, `tool_code\n...\n`, bare default_api.fn() calls
function parseInlineToolCalls(text) {
  const calls = []
  let match

  // 1. Triple-backtick code blocks (```tool_code ... ```)
  const triplePattern = /```(?:tool_code|python)?\s*\n?([\s\S]*?)```/g
  while ((match = triplePattern.exec(text)) !== null) {
    calls.push(...extractFunctionCalls(match[1].trim()))
  }

  // 2. Single-backtick blocks (`tool_code ... `) — some models do this
  if (calls.length === 0) {
    const singlePattern = /`(?:tool_code|python)?\s*\n?([\s\S]*?)`/g
    while ((match = singlePattern.exec(text)) !== null) {
      const fnCalls = extractFunctionCalls(match[1].trim())
      if (fnCalls.length > 0) calls.push(...fnCalls)
    }
  }

  // 3. Function name followed by JSON object: search_presets{"category": "motors"}
  if (calls.length === 0) {
    const jsonPattern = /(search_presets|set_component|remove_component)\s*(\{[^}]+\})/g
    while ((match = jsonPattern.exec(text)) !== null) {
      try {
        const args = JSON.parse(match[2])
        calls.push({
          id: `inline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          function: { name: match[1], arguments: JSON.stringify(args) },
        })
      } catch {}
    }
  }

  // 4. Bare function calls without any code blocks
  if (calls.length === 0) {
    const barePattern = /(?:print\()?(?:default_api\.)?(\w+)\(([^)]*)\)\)?/g
    while ((match = barePattern.exec(text)) !== null) {
      const parsed = parseFnCall(match[1], match[2])
      if (parsed) calls.push(parsed)
    }
  }

  return calls
}

function extractFunctionCalls(code) {
  const calls = []
  const pattern = /(?:print\()?(?:default_api\.)?(\w+)\(([^)]*)\)\)?/g
  let match
  while ((match = pattern.exec(code)) !== null) {
    const parsed = parseFnCall(match[1], match[2])
    if (parsed) calls.push(parsed)
  }
  return calls
}

function parseFnCall(fnName, argsStr) {
  const validFns = ['search_presets', 'set_component', 'remove_component']
  if (!validFns.includes(fnName)) return null

  // Parse Python-style keyword args: category="frame" or category='frame'
  const args = {}
  const argPattern = /(\w+)\s*=\s*["']([^"']*)["']/g
  let m
  while ((m = argPattern.exec(argsStr)) !== null) {
    args[m[1]] = m[2]
  }

  return {
    id: `inline_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    function: {
      name: fnName,
      arguments: JSON.stringify(args),
    },
  }
}

// Strip tool_code blocks from text shown to user
function cleanToolCodeFromText(text) {
  return text
    .replace(/```(?:tool_code|python)?\s*\n?[\s\S]*?```/g, '')
    .replace(/`(?:tool_code|python)\s*\n?[\s\S]*?`/g, '')
    .replace(/(?:search_presets|set_component|remove_component)\s*\{[^}]+\}/g, '')
    .replace(/(?:print\()?(?:default_api\.)?\w+\([^)]*\)\)?/g, (match) => {
      // Only strip if it looks like a tool call, not regular text
      const fnPattern = /(?:search_presets|set_component|remove_component)/
      return fnPattern.test(match) ? '' : match
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function useAi() {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const needsApiKey = ref(false)

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
    // Handle /help command locally
    if (userMessage.trim().toLowerCase() === '/help') {
      messages.value.push({ role: 'user', content: '/help' })
      messages.value.push({ role: 'assistant', content: HELP_TEXT })
      return
    }

    const store = useBuildStore()
    const { getSettings } = useStorage()
    const settings = getSettings()

    if (!settings.apiKey) {
      needsApiKey.value = true
      return
    }

    error.value = null
    messages.value.push({ role: 'user', content: userMessage })
    loading.value = true

    const systemPrompt = `You are QuadCalc AI, an expert FPV drone building assistant. You help users pick compatible components for their quadcopter builds.

You have tools to search the component database and directly modify the user's build.

CRITICAL RULES:
1. ALWAYS use the tool functions to search and add components. Never say "I can't find it" without calling search_presets first.
2. When the user confirms they want a component (e.g. "yes", "add it", "go ahead"), ALWAYS call search_presets to find the preset ID, then call set_component. Do NOT rely on memory — always search fresh.
3. Do NOT write code, use print(), or wrap calls in backticks. Just call the tool functions directly.
4. When suggesting components, search first, then present options from the actual results.

When a user asks to "add a motor" or "set up a 5 inch build", use search_presets to find options, then use set_component to assign the best match (or ask the user to choose if there are multiple good options).

When a user asks to "populate all parts", "build me a fast quad", "set up a cinematic drone", or similar broad requests, search and assign ALL relevant components (frame, motors, propellers, battery, FC, ESC, VTX, camera, RX, TX, goggles) using multiple tool calls. Pick components that work well together for the requested style.

You know about:
- Frame sizes (3", 5", 7") and which components match
- Motor stator sizes, KV ratings, and appropriate propellers
- Battery voltage (S count), connectors, and capacity
- Video systems (Analog, DJI, HDZero, Walksnail) — camera, VTX, and goggles must match
- Radio protocols (ELRS, Crossfire, FrSky, FlySky) — TX and RX must match
- Flight controllers, ESCs, mounting patterns, and voltage ratings

Be concise but thorough. If you see compatibility issues, explain WHY they're problems and suggest fixes.`

    // Build conversation history — keep last 6 messages (≈3 turns) to control cost
    const recentHistory = messages.value.slice(0, -1)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content }))

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: `Here is my current build state:\n\n${buildContext()}\n\n---\n\nUser question: ${userMessage}` },
    ]

    const MAX_ROUNDS = 4
    let responded = false

    try {
      const model = settings.model || 'google/gemini-2.0-flash-001'

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const isLastRound = round >= MAX_ROUNDS - 2 // last 2 rounds omit tools

        const requestBody = {
          model,
          messages: apiMessages,
          max_tokens: 1024,
        }

        // Include tools only in first rounds; omit later to force text
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

        let toolCalls = msg.tool_calls

        // Fallback: parse Gemini-style tool_code blocks from text
        if ((!toolCalls || toolCalls.length === 0) && msg.content) {
          const inlineCalls = parseInlineToolCalls(msg.content)
          if (inlineCalls.length > 0) {
            toolCalls = inlineCalls
          }
        }

        // If there are tool calls and we're not on the last round, execute and loop
        if (toolCalls && toolCalls.length > 0 && round < MAX_ROUNDS - 1) {
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

        // Text response (or last round). Clean any leftover tool_code from display.
        let reply = msg.content || 'Done.'
        reply = cleanToolCodeFromText(reply) || reply
        messages.value.push({ role: 'assistant', content: reply })
        responded = true
        break
      }

      // Safety: if loop exhausted without a text reply, add fallback
      if (!responded) {
        messages.value.push({ role: 'assistant', content: 'Done.' })
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
    needsApiKey,
    sendMessage,
    clearChat,
    HELP_TEXT,
  }
}
