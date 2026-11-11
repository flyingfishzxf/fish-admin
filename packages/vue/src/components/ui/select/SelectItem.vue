<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import { SelectItem as SelectItemPrimitive, SelectItemIndicator, SelectItemText } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ value: string; disabled?: boolean; class?: string }>()
</script>

<template>
  <SelectItemPrimitive
    data-slot="select-item"
    :value="value"
    :disabled="disabled"
    :class="
      cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 ps-2 pe-8 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 [&_svg:not([class*=\'text-\'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2',
        props.class,
      )
    "
  >
    <span
      data-slot="select-item-indicator"
      class="absolute end-2 flex size-3.5 items-center justify-center"
    >
      <SelectItemIndicator>
        <CheckIcon class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItemPrimitive>
</template>
