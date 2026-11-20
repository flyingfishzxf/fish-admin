<script setup lang="ts">
import { cn } from '@fish-admin/vue'

// A plain `aria-pressed` button group rather than `role="tablist"`: the filter
// swaps one list, it does not switch panels, and screen readers announce a
// toggle state without the arrow-key contract a real tablist implies.
const props = withDefaults(
  defineProps<{
    options: { value: string; label: string; disabled?: boolean }[]
    modelValue: string
    ariaLabel?: string
    size?: 'sm' | 'md'
    class?: string
  }>(),
  { ariaLabel: undefined, size: 'sm', class: undefined },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const SIZE_CLASS = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
} as const
</script>

<template>
  <div
    data-slot="segmented"
    role="group"
    :aria-label="props.ariaLabel"
    :class="cn('inline-flex items-center rounded-lg bg-muted p-0.5', props.class)"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      :data-segmented-option="option.value"
      :aria-pressed="option.value === props.modelValue"
      :disabled="option.disabled || undefined"
      :class="
        cn(
          'rounded-md font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
          SIZE_CLASS[props.size],
          option.value === props.modelValue
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )
      "
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
