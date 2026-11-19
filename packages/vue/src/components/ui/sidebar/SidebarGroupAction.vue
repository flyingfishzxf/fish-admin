<script setup lang="ts">
import { cn } from '../../../lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <button
    data-slot="sidebar-group-action"
    data-sidebar="group-action"
    :class="
      cn(
        'absolute end-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden',
        $props.class,
      )
    "
  >
    <slot />
  </button>
</template>
