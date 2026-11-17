<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

import { cn } from '../../lib/utils'

type SpinnerSize = 'sm' | 'default' | 'lg'

const props = withDefaults(
  defineProps<{
    /** Icon size: `sm` is 14 px, `default` 16 px, `lg` 24 px. */
    size?: SpinnerSize
    /** Accessible name for the `status` region; without it the spinner is `aria-hidden`. */
    label?: string
    class?: string
  }>(),
  { size: 'default' },
)

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'size-3.5',
  default: 'size-4',
  lg: 'size-6',
}
</script>

<template>
  <span
    data-slot="spinner"
    :data-size="props.size"
    :role="props.label ? 'status' : undefined"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : true"
    :class="cn('inline-flex shrink-0 items-center justify-center', props.class)"
  >
    <Loader2 aria-hidden="true" :class="cn('animate-spin', SIZE_CLASSES[props.size])" />
    <span v-if="props.label" aria-hidden="true" class="sr-only">{{ props.label }}</span>
  </span>
</template>
