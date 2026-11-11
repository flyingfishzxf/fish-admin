<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const model = defineModel<boolean | 'indeterminate'>({ default: false })

const classes = computed(() =>
  cn(
    'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
  ),
)
</script>

<template>
  <CheckboxRoot v-model="model" data-slot="checkbox" :class="classes">
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="grid place-content-center text-current transition-none"
    >
      <CheckIcon class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
