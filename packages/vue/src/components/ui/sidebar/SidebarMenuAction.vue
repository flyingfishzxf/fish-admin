<script setup lang="ts">
import { cn } from '../../../lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <button
    data-slot="sidebar-menu-action"
    data-sidebar="menu-action"
    :class="
      cn(
        'absolute end-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden',
        $props.class,
      )
    "
  >
    <slot />
  </button>
</template>
