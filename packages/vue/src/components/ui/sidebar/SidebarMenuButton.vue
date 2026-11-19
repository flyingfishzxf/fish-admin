<script setup lang="ts">
import { cn } from '../../../lib/utils'
import Tooltip from '../Tooltip.vue'
import { useSidebar } from './context'

const props = withDefaults(
  defineProps<{
    isActive?: boolean
    variant?: 'default' | 'outline'
    size?: 'default' | 'sm' | 'lg'
    tooltip?: string
    class?: string
  }>(),
  { isActive: false, variant: 'default', size: 'default' },
)

useSidebar()

const BASE =
  'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-start text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!'
const VARIANTS = {
  default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  outline: 'bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent',
}
const SIZES = { default: 'h-8', sm: 'h-7 text-xs', lg: 'h-12 text-sm' }
</script>

<template>
  <Tooltip v-if="props.tooltip">
    <template #trigger>
      <button
        type="button"
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        :data-size="props.size"
        :data-active="props.isActive"
        :class="cn(BASE, VARIANTS[props.variant], SIZES[props.size], props.class)"
      >
        <slot />
      </button>
    </template>
    {{ props.tooltip }}
  </Tooltip>
  <button
    v-else
    type="button"
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
    :data-size="props.size"
    :data-active="props.isActive"
    :class="cn(BASE, VARIANTS[props.variant], SIZES[props.size], props.class)"
  >
    <slot />
  </button>
</template>
