<script setup lang="ts">
import { cn } from '@fish-admin/vue'

// A native range input keeps the whole keyboard and pointer contract for free.
// `accent-primary` colours the thumb and the filled half, so the control still
// follows the theme instead of looking like a default browser widget.
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    ariaLabel?: string
    class?: string
  }>(),
  { min: 0, max: 100, step: 1, ariaLabel: undefined, class: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function onInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) emit('update:modelValue', value)
}
</script>

<template>
  <input
    type="range"
    data-slider
    :value="props.modelValue"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :aria-label="props.ariaLabel"
    :class="cn('h-1.5 w-full cursor-pointer accent-primary', props.class)"
    @input="onInput"
  />
</template>
