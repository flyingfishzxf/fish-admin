<script setup lang="ts">
import { AccordionItem as AccordionItemPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; disabled?: boolean; class?: string }>()
</script>

<template>
  <AccordionItemPrimitive
    data-slot="accordion-item"
    :value="value"
    :disabled="disabled"
    :class="cn('border-b last:border-b-0', props.class)"
  >
    <slot />
  </AccordionItemPrimitive>
</template>
