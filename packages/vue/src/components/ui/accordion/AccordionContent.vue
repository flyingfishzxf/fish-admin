<script setup lang="ts">
import { AccordionContent as AccordionContentPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AccordionContentPrimitive
    data-slot="accordion-content"
    class="overflow-hidden text-sm duration-(--motion-duration-base) ease-(--motion-ease-standard) data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none!"
  >
    <div :class="cn('pt-0 pb-4', props.class)">
      <slot />
    </div>
  </AccordionContentPrimitive>
</template>
