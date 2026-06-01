<template>
  <div class="ai-chat-wrapper" :class="{ expanded: panelSize !== 'default' }">
    <!-- Toggle button -->
    <button
      class="ai-toggle tron-btn"
      :class="{ 'active': isOpen }"
      @click="isOpen = !isOpen"
    >
      AI
    </button>

    <!-- Chat panel -->
    <Transition name="chat-slide">
      <div v-if="isOpen" class="ai-panel tron-panel" :class="panelSize">
        <div class="panel-top">
          <h3 class="text-xs font-bold text-tron-cyan tracking-wider uppercase">QuadCalc AI</h3>
          <div class="flex items-center gap-1">
            <button class="tron-btn text-[10px] px-2 py-0.5" @click="cycleSize" :title="sizeLabel">{{ sizeIcon }}</button>
            <button class="tron-btn text-[10px] px-2 py-0.5" @click="clearChat">CLEAR</button>
            <button class="tron-btn text-[10px] px-2 py-0.5" @click="isOpen = false">X</button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages" ref="messagesRef">
          <!-- No API key yet -->
          <div v-if="!hasKey" class="nokey-card">
            <div class="nokey-title">AI needs a free API key</div>
            <p class="nokey-text">
              The assistant uses your own free <strong>OpenRouter</strong> key — it stays in this browser.
            </p>
            <ol class="nokey-steps">
              <li>Create a key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a></li>
              <li>Paste it into Settings</li>
            </ol>
            <button class="tron-btn-success tron-btn nokey-btn" @click="addKey">ADD API KEY</button>
          </div>

          <div v-else-if="messages.length === 0" class="empty-state">
            <div class="text-tron-text/30 text-xs mb-3">
              Ask about your build — compatibility, suggestions, or anything FPV.
            </div>
            <div class="text-tron-cyan/30 text-[10px] font-mono">
              Type <span class="text-tron-cyan/50">/help</span> to see what I can do
            </div>
          </div>

          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message"
            :class="msg.role"
          >
            <template v-if="msg.role === 'action'">
              <div class="action-content">
                <span class="action-icon" :class="msg.actionType">{{ msg.actionType === 'set' ? '[+]' : '[-]' }}</span>
                <span>{{ msg.content }}</span>
              </div>
            </template>
            <template v-else>
              <div class="msg-label">{{ msg.role === 'user' ? 'YOU' : 'AI' }}</div>
              <div class="msg-content" v-html="renderMarkdown(msg.content)"></div>
            </template>
          </div>

          <div v-if="loading" class="message assistant">
            <div class="msg-label">AI</div>
            <div class="msg-content text-tron-cyan/50 animate-pulse-glow">Thinking...</div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-[10px] text-tron-red px-3 py-1">{{ error }}</div>

        <!-- Input -->
        <div class="chat-input-row">
          <input
            v-model="input"
            class="tron-input flex-1 text-xs"
            placeholder="Ask about your build... (/help)"
            @keydown.enter="send"
          />
          <button class="tron-btn text-xs px-3" @click="send" :disabled="loading || !input.trim()">
            SEND
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, inject } from 'vue'
import { useAi } from '../composables/useAi.js'
import { useTheme } from '../composables/useTheme.js'
import { useStorage } from '../composables/useStorage.js'

const { messages, loading, error, needsApiKey, sendMessage, clearChat } = useAi()
const { getSettings } = useStorage()
const openSettings = inject('openSettings', null)
const { isDark } = useTheme()

// Whether an OpenRouter key is configured (re-checked when the panel opens,
// since the key may have just been added in Settings).
const hasKey = ref(!!getSettings().apiKey)
function refreshKey() { hasKey.value = !!getSettings().apiKey }

watch(needsApiKey, (val) => {
  if (val) {
    refreshKey()
    openSettings?.()
    needsApiKey.value = false
  }
})

const isOpen = ref(false)
watch(isOpen, (open) => { if (open) refreshKey() })

function addKey() {
  openSettings?.()
}
const input = ref('')
const messagesRef = ref(null)
const panelSize = ref('default') // 'default' | 'half' | 'full'

const sizeIcon = computed(() => {
  if (panelSize.value === 'default') return '\u21F1' // ⇱ expand
  if (panelSize.value === 'half') return '\u21F2' // ⇲ expand more
  return '\u21B5' // ↵ collapse
})

const sizeLabel = computed(() => {
  if (panelSize.value === 'default') return 'Expand to half screen'
  if (panelSize.value === 'half') return 'Expand to full screen'
  return 'Collapse to default'
})

function cycleSize() {
  if (panelSize.value === 'default') panelSize.value = 'half'
  else if (panelSize.value === 'half') panelSize.value = 'full'
  else panelSize.value = 'default'
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  refreshKey()
  if (!hasKey.value) {
    // Keep the typed text so the user can resend after adding a key
    openSettings?.()
    return
  }
  input.value = ''
  await sendMessage(text)
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function renderMarkdown(text) {
  const codeBg = isDark.value ? 'rgba(0,240,255,0.08)' : 'rgba(8,145,178,0.08)'
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, `<code style="background:${codeBg};padding:1px 4px;font-size:11px;">$1</code>`)
    .replace(/\n/g, '<br>')
}

watch(messages, () => {
  nextTick(scrollToBottom)
}, { deep: true })
</script>

<style scoped>
.ai-chat-wrapper {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 30;
}
.ai-chat-wrapper.expanded {
  z-index: 40;
}

.ai-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 700;
}
.ai-toggle.active {
  background: var(--qc-cyan-015);
  border-color: var(--qc-cyan);
  box-shadow: var(--qc-glow-cyan);
}

.ai-panel {
  position: absolute;
  bottom: 48px;
  right: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, height 0.2s ease;
}

/* Default size */
.ai-panel.default {
  width: 360px;
  height: 460px;
}

/* Half screen */
.ai-panel.half {
  width: 50vw;
  height: 70vh;
  min-width: 400px;
}

/* Full screen */
.ai-panel.full {
  position: fixed;
  top: 56px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  width: auto;
  height: auto;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--qc-cyan-01);
  flex-shrink: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-state {
  text-align: center;
  padding: 24px 8px;
}

/* No-API-key card */
.nokey-card {
  margin: 8px;
  padding: 14px;
  border: 1px solid var(--qc-cyan-02);
  background: var(--qc-cyan-005);
  text-align: center;
}
.nokey-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--qc-cyan);
  letter-spacing: 0.5px;
  text-shadow: var(--qc-glow-text-cyan);
  margin-bottom: 6px;
}
.nokey-text {
  font-size: 11px;
  line-height: 1.5;
  color: var(--qc-text);
  margin: 0 0 8px;
}
.nokey-steps {
  text-align: left;
  margin: 0 auto 10px;
  padding-left: 18px;
  max-width: 240px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  line-height: 1.6;
  color: var(--qc-text);
  list-style: decimal;
}
.nokey-steps li::marker { color: var(--qc-cyan-05); }
.nokey-steps a {
  color: var(--qc-cyan);
  text-decoration: none;
  border-bottom: 1px solid var(--qc-cyan-03);
}
.nokey-steps a:hover { text-shadow: var(--qc-glow-text-cyan); }
.nokey-btn {
  width: 100%;
  font-size: 11px;
}

.message {
  padding: 6px 8px;
}
.message.user {
  background: var(--qc-cyan-005);
  border-left: 2px solid var(--qc-cyan-03);
}
.message.assistant {
  background: var(--qc-green-003);
  border-left: 2px solid var(--qc-green-02);
}

.message.action {
  background: var(--qc-green-006);
  border-left: 2px solid var(--qc-green-04);
  padding: 4px 8px;
}
.action-content {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: var(--qc-green);
  display: flex;
  align-items: center;
  gap: 6px;
}
.action-icon {
  font-weight: 700;
  font-size: 13px;
}
.action-icon.set {
  color: var(--qc-green);
}
.action-icon.remove {
  color: var(--qc-red);
}

.msg-label {
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: var(--qc-text-muted);
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.msg-content {
  font-size: 12px;
  line-height: 1.5;
  color: var(--qc-text);
}

.chat-input-row {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--qc-cyan-01);
  flex-shrink: 0;
}

.chat-slide-enter-active, .chat-slide-leave-active {
  transition: all 0.2s ease;
}
.chat-slide-enter-from, .chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 768px) {
  .ai-chat-wrapper {
    position: relative;
    bottom: auto;
    right: auto;
    align-self: flex-start;
    margin: 4px 0 0 8px;
    z-index: 16;
  }
  .ai-toggle {
    width: 32px;
    height: 32px;
    font-size: 10px;
  }
  .ai-panel {
    position: fixed;
    inset: 0;
    bottom: 0;
    right: 0;
    width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    border-radius: 0;
  }
}
</style>
