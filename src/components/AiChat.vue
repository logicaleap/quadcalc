<template>
  <div class="ai-chat-wrapper">
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
      <div v-if="isOpen" class="ai-panel tron-panel">
        <div class="panel-top">
          <h3 class="text-xs font-bold text-tron-cyan tracking-wider uppercase">QuadCalc AI</h3>
          <div class="flex items-center gap-1">
            <button class="tron-btn text-[10px] px-2 py-0.5" @click="clearChat">CLEAR</button>
            <button class="tron-btn text-[10px] px-2 py-0.5" @click="isOpen = false">X</button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages" ref="messagesRef">
          <div v-if="messages.length === 0" class="text-center text-tron-text/30 text-xs py-6">
            Ask about your build — compatibility, suggestions, or anything FPV.
          </div>

          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="message"
            :class="msg.role"
          >
            <template v-if="msg.role === 'action'">
              <div class="action-content">
                <span class="action-icon" :class="msg.actionType">{{ msg.actionType === 'set' ? '\u2713' : '\u2717' }}</span>
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
            placeholder="Ask about your build..."
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
import { ref, nextTick, watch } from 'vue'
import { useAi } from '../composables/useAi.js'

const { messages, loading, error, sendMessage, clearChat } = useAi()

const isOpen = ref(false)
const input = ref('')
const messagesRef = ref(null)

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
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,240,255,0.08);padding:1px 4px;font-size:11px;">$1</code>')
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
  background: rgba(0, 240, 255, 0.15);
  border-color: var(--color-tron-cyan);
  box-shadow: 0 0 12px rgba(0, 240, 255, 0.3);
}

.ai-panel {
  position: absolute;
  bottom: 48px;
  right: 0;
  width: 360px;
  height: 460px;
  display: flex;
  flex-direction: column;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 240, 255, 0.1);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message {
  padding: 6px 8px;
}
.message.user {
  background: rgba(0, 240, 255, 0.05);
  border-left: 2px solid rgba(0, 240, 255, 0.3);
}
.message.assistant {
  background: rgba(0, 255, 136, 0.03);
  border-left: 2px solid rgba(0, 255, 136, 0.2);
}

.message.action {
  background: rgba(0, 255, 136, 0.06);
  border-left: 2px solid rgba(0, 255, 136, 0.4);
  padding: 4px 8px;
}
.action-content {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  color: var(--color-tron-green);
  display: flex;
  align-items: center;
  gap: 6px;
}
.action-icon {
  font-weight: 700;
  font-size: 13px;
}
.action-icon.set {
  color: var(--color-tron-green);
}
.action-icon.remove {
  color: var(--color-tron-red);
}

.msg-label {
  font-size: 9px;
  font-family: 'Share Tech Mono', monospace;
  color: rgba(197, 208, 224, 0.3);
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.msg-content {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-tron-text);
}

.chat-input-row {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid rgba(0, 240, 255, 0.1);
}

.chat-slide-enter-active, .chat-slide-leave-active {
  transition: all 0.2s ease;
}
.chat-slide-enter-from, .chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
