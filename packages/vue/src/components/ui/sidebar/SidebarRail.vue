<script setup lang="ts">
import { cn } from '../../../lib/utils'
import { useSidebar } from './context'

const props = defineProps<{ class?: string }>()
const sidebar = useSidebar()
</script>

<template>
  <button
    data-sidebar="rail"
    data-slot="sidebar-rail"
    aria-label="Toggle sidebar"
    tabindex="-1"
    title="Toggle sidebar"
    :class="
      cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex',
        'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
        props.class,
      )
    "
    @click="sidebar.toggleSidebar()"
  ></button>
</template>
