<script setup lang="ts">
import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<{ isActive?: boolean; size?: 'sm' | 'md'; class?: string }>(),
  { isActive: false, size: 'md' },
)
</script>

<template>
  <a
    data-slot="sidebar-menu-sub-button"
    data-sidebar="menu-sub-button"
    :data-size="props.size"
    :data-active="props.isActive"
    :class="
      cn(
        'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium',
        props.class,
      )
    "
  >
    <slot />
  </a>
</template>
