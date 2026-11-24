<script setup lang="ts">
import { DropdownMenuSubContent as DropdownMenuSubContentPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()

const classes = computed(() =>
  cn(
    'z-50 min-w-[8rem] origin-(--reka-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none!',
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuSubContentPrimitive data-slot="dropdown-menu-sub-content" :class="classes">
    <slot />
  </DropdownMenuSubContentPrimitive>
</template>
