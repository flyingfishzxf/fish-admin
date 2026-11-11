<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import { AccordionTrigger as AccordionTriggerPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

import AccordionHeader from './AccordionHeader.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ disabled?: boolean; class?: string }>()
</script>

<template>
  <AccordionHeader>
    <AccordionTriggerPrimitive
      v-bind="$attrs"
      data-slot="accordion-trigger"
      :disabled="disabled"
      :class="
        cn(
          'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-start text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none! [&[data-state=open]>svg]:rotate-180',
          props.class,
        )
      "
    >
      <slot />
      <ChevronDownIcon
        class="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-(--motion-duration-base) ease-(--motion-ease-standard) motion-reduce:transition-none!"
      />
    </AccordionTriggerPrimitive>
  </AccordionHeader>
</template>
