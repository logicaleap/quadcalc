<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-tron-cyan text-sm font-bold tracking-wider uppercase">Settings</h3>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <div class="space-y-4">
            <!-- API Key -->
            <div>
              <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-1">
                OpenRouter API Key
              </label>
              <input
                v-model="apiKey"
                type="password"
                class="tron-input w-full text-sm"
                placeholder="sk-or-..."
              />
              <p class="text-[10px] text-tron-text/30 mt-1">
                Get a key at <span class="text-tron-cyan/50">openrouter.ai</span>. Stored locally in your browser only.
              </p>
            </div>

            <!-- Model selector -->
            <div>
              <label class="text-xs text-tron-text/50 uppercase tracking-wider font-mono block mb-1">
                AI Model
              </label>
              <select v-model="model" class="tron-input w-full text-sm">
                <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash (free)</option>
                <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B (free)</option>
                <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                <option value="openai/gpt-4o">GPT-4o</option>
              </select>
            </div>

            <button class="tron-btn-success tron-btn w-full text-sm" @click="save">
              SAVE SETTINGS
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStorage } from '../composables/useStorage.js'

const props = defineProps({
  show: Boolean,
})

const emit = defineEmits(['close'])

const { getSettings, saveSettings } = useStorage()

const apiKey = ref('')
const model = ref('google/gemini-2.0-flash-001')

onMounted(() => {
  const s = getSettings()
  apiKey.value = s.apiKey || ''
  model.value = s.model || 'google/gemini-2.0-flash-001'
})

function save() {
  saveSettings({
    apiKey: apiKey.value,
    model: model.value,
  })
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 400px;
  max-width: 90vw;
  padding: 24px;
}

select.tron-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300f0ff' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}
select.tron-input option {
  background: #0d1117;
  color: #c5d0e0;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
