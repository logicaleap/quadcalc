<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content tron-panel animate-fade-in">
          <div class="modal-header">
            <h3 class="text-tron-cyan text-sm font-bold tracking-wider uppercase flex items-center gap-2">
              <span class="signature-glyph">🛸</span> Send Feedback
            </h3>
            <button class="tron-btn text-xs px-2 py-1" @click="$emit('close')">CLOSE</button>
          </div>

          <!-- Personal intro -->
          <div class="intro">
            <p class="intro-line">
              Hey, I'm <strong class="text-tron-cyan">Asaf</strong> — I built QuadCalc.
            </p>
            <p class="intro-sub">
              Found a bug? Got an idea? Just want to say hi? Drop me a line below — I read every message personally.
            </p>
          </div>

          <!-- Success state -->
          <div v-if="sent" class="success-state">
            <div class="success-mark">✓</div>
            <div class="success-title">Message sent!</div>
            <div class="success-sub">Thanks for taking the time. I'll get back to you if you left an email.</div>
            <button class="tron-btn text-xs mt-3" @click="$emit('close')">DONE</button>
          </div>

          <form v-else class="feedback-form" @submit.prevent="submit">
            <!-- Category radios -->
            <div class="field">
              <label class="field-label">What's this about?</label>
              <div class="radio-group">
                <label class="radio-option" :class="{ selected: category === 'bug' }">
                  <input type="radio" value="bug" v-model="category" />
                  <span class="radio-icon">🐛</span>
                  <span class="radio-label">Something's broken</span>
                </label>
                <label class="radio-option" :class="{ selected: category === 'idea' }">
                  <input type="radio" value="idea" v-model="category" />
                  <span class="radio-icon">💡</span>
                  <span class="radio-label">I wish QuadCalc could…</span>
                </label>
                <label class="radio-option" :class="{ selected: category === 'hi' }">
                  <input type="radio" value="hi" v-model="category" />
                  <span class="radio-icon">👋</span>
                  <span class="radio-label">Just saying hi</span>
                </label>
              </div>
            </div>

            <!-- Message -->
            <div class="field">
              <label class="field-label" for="fb-message">{{ messagePlaceholder.label }}</label>
              <textarea
                id="fb-message"
                v-model="message"
                class="tron-input feedback-textarea"
                :placeholder="messagePlaceholder.placeholder"
                rows="5"
                required
              ></textarea>
            </div>

            <!-- Email (optional) -->
            <div class="field">
              <label class="field-label" for="fb-email">
                Your email <span class="text-tron-text/40">(optional, so I can reply)</span>
              </label>
              <input
                id="fb-email"
                v-model="email"
                type="email"
                class="tron-input"
                placeholder="you@example.com"
              />
            </div>

            <!-- Honeypot (hidden) -->
            <input type="checkbox" name="botcheck" v-model="botcheck" class="honeypot" tabindex="-1" autocomplete="off" />

            <!-- Build snapshot disclosure -->
            <div v-if="store.filledCount > 0" class="snapshot-note">
              <span class="snapshot-icon">📎</span>
              Includes a snapshot of your current build ({{ store.filledCount }} component{{ store.filledCount === 1 ? '' : 's' }}) for context.
            </div>

            <!-- Error -->
            <div v-if="error" class="error-msg">{{ error }}</div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" class="tron-btn text-xs" @click="$emit('close')">CANCEL</button>
              <button type="submit" class="tron-btn text-xs primary" :disabled="submitting || !canSubmit">
                {{ submitting ? 'SENDING…' : 'SEND →' }}
              </button>
            </div>

            <!-- Fallback -->
            <div class="fallback">
              Prefer email? Write directly to
              <a :href="mailtoFallback" class="mailto-link">asaf@shamir.com.au</a>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBuildStore } from '../stores/buildStore.js'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const WEB3FORMS_ACCESS_KEY = 'dfc04377-5763-482a-9690-2c526293722c'

const store = useBuildStore()

const category = ref('idea')
const message = ref('')
const email = ref('')
const botcheck = ref(false)
const submitting = ref(false)
const sent = ref(false)
const error = ref('')
const country = ref('')

const timezone = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
})()
const locale = (typeof navigator !== 'undefined' && navigator.language) || ''
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : ''

let countryFetched = false
async function ensureCountry() {
  if (countryFetched) return
  countryFetched = true
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return
    const data = await res.json()
    if (data && data.country_name) {
      country.value = data.country_code
        ? `${data.country_name} (${data.country_code})`
        : data.country_name
    }
  } catch {
    // silent — country is best-effort
  }
}

const messagePlaceholder = computed(() => {
  if (category.value === 'bug') {
    return {
      label: 'Tell me what went wrong',
      placeholder: 'What were you doing? What did you expect? What actually happened?'
    }
  }
  if (category.value === 'idea') {
    return {
      label: 'What should QuadCalc do?',
      placeholder: 'Describe the feature, preset, or improvement you wish existed…'
    }
  }
  return {
    label: 'Your message',
    placeholder: 'Anything on your mind — first impressions, questions, suggestions…'
  }
})

const canSubmit = computed(() => message.value.trim().length > 0)

function buildSnapshot() {
  const comps = store.components
  if (!comps) return null
  const selected = {}
  Object.entries(comps).forEach(([key, c]) => {
    if (c) selected[key] = c.name || c.id || 'unknown'
  })
  if (Object.keys(selected).length === 0) return null
  return {
    filled: store.filledCount,
    totalWeightGrams: store.totalWeight,
    totalCostCents: store.totalCost,
    components: selected,
  }
}

const mailtoFallback = computed(() => {
  const subject = encodeURIComponent('QuadCalc feedback')
  const body = encodeURIComponent(
    `[${category.value}] ${message.value}\n\n— sent from QuadCalc`
  )
  return `mailto:asaf@shamir.com.au?subject=${subject}&body=${body}`
})

async function submit() {
  if (!canSubmit.value || submitting.value) return
  error.value = ''
  submitting.value = true

  const snapshot = buildSnapshot()
  const categoryLabel = { bug: '🐛 Bug', idea: '💡 Idea', hi: '👋 Hi' }[category.value]

  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `QuadCalc Feedback — ${categoryLabel}`,
    from_name: email.value ? email.value : 'Anonymous QuadCalc user',
    email: email.value || 'no-reply@quadcalc.local',
    category: category.value,
    message: message.value,
    build_snapshot: snapshot ? JSON.stringify(snapshot, null, 2) : '(no build started)',
    app_version: appVersion || '(unknown)',
    country: country.value || '(unknown)',
    timezone: timezone || '(unknown)',
    locale: locale || '(unknown)',
    page_url: window.location.href,
    user_agent: navigator.userAgent,
    botcheck: botcheck.value,
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success !== false) {
      sent.value = true
    } else {
      error.value = data.message || 'Could not send. Try the email fallback below?'
    }
  } catch (e) {
    error.value = 'Network error. Try the email fallback below?'
  } finally {
    submitting.value = false
  }
}

// Reset form state every time the modal opens, and kick off the
// country lookup in the background so it's ready by submit time.
watch(() => props.show, (val) => {
  if (val) {
    sent.value = false
    error.value = ''
    submitting.value = false
    category.value = 'idea'
    message.value = ''
    email.value = ''
    botcheck.value = false
    ensureCountry()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--qc-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 520px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px 22px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.signature-glyph {
  font-size: 16px;
  filter: drop-shadow(0 0 4px var(--color-tron-cyan));
}

.intro {
  border-left: 2px solid var(--color-tron-cyan);
  padding: 4px 0 4px 10px;
  margin-bottom: 16px;
}
.intro-line {
  font-size: 13px;
  color: var(--color-tron-text);
  margin-bottom: 2px;
}
.intro-sub {
  font-size: 12px;
  color: var(--color-tron-text);
  opacity: 0.7;
  line-height: 1.5;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-label {
  display: block;
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-tron-cyan);
  margin-bottom: 6px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--qc-cyan-01);
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-tron-text);
  transition: background 0.15s, border-color 0.15s;
}
.radio-option:hover {
  background: var(--qc-cyan-005);
}
.radio-option.selected {
  border-color: var(--color-tron-cyan);
  background: var(--qc-cyan-01);
  box-shadow: 0 0 6px var(--qc-cyan-01);
}
.radio-option input {
  accent-color: var(--color-tron-cyan);
}
.radio-icon { font-size: 16px; }
.radio-label { flex: 1; }

.feedback-textarea {
  width: 100%;
  resize: vertical;
  min-height: 90px;
  font-family: inherit;
}

.feedback-form .tron-input {
  width: 100%;
  box-sizing: border-box;
}

.snapshot-note {
  font-size: 11px;
  color: var(--color-tron-text);
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px dashed var(--qc-cyan-01);
  border-radius: 2px;
}
.snapshot-icon { font-size: 12px; }

.error-msg {
  font-size: 12px;
  color: var(--color-tron-red, #ff4060);
  padding: 6px 8px;
  border: 1px solid var(--color-tron-red, #ff4060);
  border-radius: 2px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.tron-btn.primary {
  background: var(--qc-cyan-015);
  border-color: var(--color-tron-cyan);
  color: var(--color-tron-cyan);
}
.tron-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fallback {
  font-size: 11px;
  color: var(--color-tron-text);
  opacity: 0.5;
  text-align: center;
  margin-top: 6px;
}
.mailto-link {
  color: var(--color-tron-cyan);
  text-decoration: underline;
}

.honeypot {
  position: absolute;
  left: -9999px;
  opacity: 0;
  pointer-events: none;
}

/* Success */
.success-state {
  text-align: center;
  padding: 24px 8px;
}
.success-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-tron-green, #4ade80);
  color: var(--color-tron-green, #4ade80);
  font-size: 24px;
  margin-bottom: 10px;
  box-shadow: 0 0 12px var(--color-tron-green, #4ade80);
}
.success-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  color: var(--color-tron-green, #4ade80);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.success-sub {
  font-size: 12px;
  color: var(--color-tron-text);
  opacity: 0.7;
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.5;
}

.modal-enter-active, .modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>
