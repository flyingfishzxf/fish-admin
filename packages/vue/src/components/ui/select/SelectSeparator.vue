<script setup lang="ts">
import { SelectSeparator as SelectSeparatorPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectSeparatorPrimitive
    data-slot="select-separator"
    :class="cn('pointer-events-none -mx-1 my-1 h-px bg-border', props.class)"
  />
</template>
