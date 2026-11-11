<script setup lang="ts">
import { SelectLabel as SelectLabelPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectLabelPrimitive
    data-slot="select-label"
    :class="cn('px-2 py-1.5 text-xs text-muted-foreground', props.class)"
  >
    <slot />
  </SelectLabelPrimitive>
</template>
