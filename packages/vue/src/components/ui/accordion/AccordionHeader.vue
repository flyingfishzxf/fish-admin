<script setup lang="ts">
import { AccordionHeader as AccordionHeaderPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AccordionHeaderPrimitive :class="cn('flex', props.class)">
    <slot />
  </AccordionHeaderPrimitive>
</template>
