<script setup lang="ts">
import { Circle } from 'lucide-vue-next'
import {
  DropdownMenuItemIndicator,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
} from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ value: string; disabled?: boolean; class?: string }>(), {
  disabled: false,
})

const classes = computed(() =>
  cn(
    "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuRadioItemPrimitive
    data-slot="dropdown-menu-radio-item"
    :value="props.value"
    :disabled="props.disabled"
    :class="classes"
  >
    <span class="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Circle class="size-2 fill-current" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItemPrimitive>
</template>
