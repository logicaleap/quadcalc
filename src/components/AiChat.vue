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
          <div v-if="messages.length === 0" class="empty-state">
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

const { messages, loading, error, needsApiKey, sendMessage, clearChat } = useAi()
const openSettings = inject('openSettings', null)
const { isDark } = useTheme()

watch(needsApiKey, (val) => {
  if (val) {
    openSettings?.()
    needsApiKey.value = false
  }
})

const isOpen = ref(false)
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
</style>
