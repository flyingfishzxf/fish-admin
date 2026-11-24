<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{ orientation?: 'horizontal' | 'vertical'; class?: string }>(),
  { orientation: 'horizontal' },
)

const classes = computed(() =>
  props.orientation === 'vertical'
    ? cn('h-full w-px shrink-0 bg-border', props.class)
    : cn('h-px w-full shrink-0 bg-border', props.class),
)
</script>

<template>
  <div role="separator" :aria-orientation="props.orientation" :class="classes" />
</template>
