<template>
  <div class="selector-root">
    <input
      v-model="search"
      type="text"
      class="tron-input w-full text-sm shrink-0"
      placeholder="Search components..."
    />

    <div class="selector-list">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="p-2 cursor-pointer tron-border transition-all hover:border-tron-cyan/50 hover:bg-tron-cyan/5 group"
        :class="{ 'border-tron-cyan/50 bg-tron-cyan/10': selected?.id === item.id }"
        @click="$emit('select', item)"
      >
        <div class="flex items-center justify-between">
          <span class="text-tron-text-bright text-sm font-semibold font-[Rajdhani]">{{ item.name }}</span>
          <span class="text-tron-cyan text-xs font-mono">{{ formatCost(item.cost) }}</span>
        </div>
        <p class="text-xs text-tron-text/60 mt-0.5">{{ item.description }}</p>
        <div class="flex flex-wrap gap-1 mt-1">
          <span
            v-for="(val, key) in mainSpecs(item)"
            :key="key"
            class="text-[10px] px-1.5 py-0.5 bg-tron-cyan/5 border border-tron-cyan/10 text-tron-cyan/70 font-mono"
          >
            {{ key }}: {{ val }}
          </span>
        </div>
      </div>

      <div v-if="filtered.length === 0" class="text-center text-tron-text/40 py-4 text-sm">
        No matching components
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatCurrency } from '../utils/helpers.js'

const props = defineProps({
  items: { type: Array, default: () => [] },
  selected: { type: Object, default: null },
})

defineEmits(['select'])

const search = ref('')

// Reset search when items change (category switch)
watch(() => props.items, () => {
  search.value = ''
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return props.items
  return props.items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q) ||
    Object.values(item.specs || {}).some(v => String(v).toLowerCase().includes(q))
  )
})

function formatCost(cents) {
  return formatCurrency(cents)
}

function mainSpecs(item) {
  if (!item.specs) return {}
  const entries = Object.entries(item.specs).slice(0, 4)
  return Object.fromEntries(entries.map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : v]))
}
</script>

<style scoped>
.selector-root {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}
.selector-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
