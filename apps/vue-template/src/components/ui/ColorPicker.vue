<script setup lang="ts">
import { ChevronsUpDown } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import Popover from './Popover.vue'

const PRESETS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#10b981',
  '#0ea5e9',
  '#64748b',
]

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

const props = withDefaults(
  defineProps<{ modelValue: string; ariaLabel?: string; class?: string }>(),
  { ariaLabel: undefined, class: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const draft = ref(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    draft.value = value
  },
)

/** Expands shorthand hex and lowercases, or returns null for anything invalid. */
function normalize(value: string) {
  const text = value.startsWith('#') ? value : `#${value}`
  if (!HEX_PATTERN.test(text)) return null
  const raw = text.slice(1).toLowerCase()
  return raw.length === 3
    ? `#${raw
        .split('')
        .map((char) => char + char)
        .join('')}`
    : `#${raw}`
}

function pick(value: string) {
  const normalized = normalize(value)
  if (!normalized) return
  draft.value = normalized
  emit('update:modelValue', normalized)
}

function commitDraft() {
  const normalized = normalize(draft.value)
  if (!normalized) {
    draft.value = props.modelValue
    return
  }
  pick(normalized)
}
</script>

<template>
  <Popover :class="props.class ?? 'w-60 p-3'" align="end">
    <template #trigger>
      <button
        type="button"
        data-color-trigger
        :aria-label="props.ariaLabel"
        class="flex h-8 w-full items-center gap-2 rounded-lg border bg-background px-2 text-sm"
      >
        <span
          data-color-swatch
          class="size-4 shrink-0 rounded-sm border"
          :style="{ backgroundColor: props.modelValue }"
        />
        <span class="flex-1 text-left font-mono text-xs uppercase">{{ props.modelValue }}</span>
        <ChevronsUpDown class="size-3.5 shrink-0 text-muted-foreground" />
      </button>
    </template>

    <div class="space-y-3">
      <input
        type="color"
        data-color-native
        :value="props.modelValue"
        :aria-label="props.ariaLabel"
        class="h-8 w-full cursor-pointer rounded-md border bg-transparent"
        @input="pick(($event.target as HTMLInputElement).value)"
      />

      <input
        :value="draft"
        data-color-hex
        :aria-label="props.ariaLabel"
        spellcheck="false"
        class="h-8 w-full rounded-md border bg-background px-2 font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        @input="draft = ($event.target as HTMLInputElement).value"
        @change="commitDraft"
        @keydown.enter="commitDraft"
      />

      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="preset in PRESETS"
          :key="preset"
          type="button"
          :data-color-preset="preset"
          :aria-pressed="preset === props.modelValue"
          :aria-label="preset"
          :style="{ backgroundColor: preset }"
          class="size-6 rounded-md border ring-offset-2 ring-offset-popover aria-pressed:ring-2 aria-pressed:ring-ring"
          @click="pick(preset)"
        />
      </div>
    </div>
  </Popover>
</template>
