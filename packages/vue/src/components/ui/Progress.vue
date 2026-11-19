<script setup lang="ts">
import { ProgressRoot } from 'reka-ui'

import { cn } from '../../lib/utils'

const props = defineProps<{
  value?: number
  class?: string
}>()
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    :model-value="props.value ?? 0"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <div
      data-slot="progress-indicator"
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - (props.value ?? 0)}%)` }"
    ></div>
  </ProgressRoot>
</template>
