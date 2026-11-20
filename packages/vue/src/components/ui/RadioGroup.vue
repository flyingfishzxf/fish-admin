<script setup lang="ts">
import { useId } from 'vue'

import { cn } from '../../lib/utils'

// Native radio inputs rather than a Reka wrapper: the browser already gives
// arrow-key navigation, a shared name and the correct announcement, and the
// control is used once.
const props = withDefaults(
  defineProps<{
    modelValue: string
    options: { value: string; label: string; disabled?: boolean }[]
    ariaLabel?: string
    name?: string
    class?: string
  }>(),
  { ariaLabel: undefined, name: undefined, class: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const groupName = `radio-${useId()}`
</script>

<template>
  <div
    data-slot="radio-group"
    role="radiogroup"
    :aria-label="props.ariaLabel"
    :class="cn('flex flex-wrap items-center gap-4', props.class)"
  >
    <label
      v-for="option in props.options"
      :key="option.value"
      class="flex cursor-pointer items-center gap-2 text-sm"
      :class="option.disabled ? 'cursor-not-allowed opacity-50' : ''"
    >
      <input
        type="radio"
        class="size-4 accent-primary"
        :name="props.name ?? groupName"
        :value="option.value"
        :checked="option.value === props.modelValue"
        :disabled="option.disabled || undefined"
        :data-radio-option="option.value"
        @change="emit('update:modelValue', option.value)"
      />
      <span class="font-normal">{{ option.label }}</span>
    </label>
  </div>
</template>
