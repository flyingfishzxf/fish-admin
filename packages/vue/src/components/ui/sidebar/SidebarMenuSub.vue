<script setup lang="ts">
import { cn } from '../../../lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <ul
    data-slot="sidebar-menu-sub"
    data-sidebar="menu-sub"
    :class="
      cn(
        'mx-3.5 flex min-w-0 border-s border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden',
        $props.class,
      )
    "
  >
    <slot />
  </ul>
</template>
