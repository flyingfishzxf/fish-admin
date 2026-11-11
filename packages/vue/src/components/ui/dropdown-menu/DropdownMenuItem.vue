<script setup lang="ts">
import { DropdownMenuItem as DropdownMenuItemPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{
    inset?: boolean
    variant?: 'default' | 'destructive'
    disabled?: boolean
    class?: string
  }>(),
  { inset: false, variant: 'default', disabled: false },
)

const emit = defineEmits<{ select: [event: Event] }>()
const classes = computed(() =>
  cn(
    "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:ps-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
    props.class,
  ),
)
</script>

<template>
  <DropdownMenuItemPrimitive
    data-slot="dropdown-menu-item"
    :data-inset="inset || undefined"
    :data-variant="variant"
    :disabled="disabled"
    :class="classes"
    @select="emit('select', $event)"
  >
    <slot />
  </DropdownMenuItemPrimitive>
</template>
