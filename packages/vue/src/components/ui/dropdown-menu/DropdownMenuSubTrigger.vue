<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{ inset?: boolean; disabled?: boolean; class?: string }>(),
  { inset: false, disabled: false },
)

const classes = computed(() =>
  cn(
    'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[inset]:ps-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 [&_svg:not([class*=\'text-\'])]:text-muted-foreground',
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuSubTriggerPrimitive
    data-slot="dropdown-menu-sub-trigger"
    :data-inset="props.inset || undefined"
    :disabled="props.disabled"
    :class="classes"
  >
    <slot />
    <ChevronRight class="ms-auto size-4" />
  </DropdownMenuSubTriggerPrimitive>
</template>
