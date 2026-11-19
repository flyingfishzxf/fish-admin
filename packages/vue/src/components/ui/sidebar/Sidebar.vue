<script setup lang="ts">
import { computed } from 'vue'

import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'
import Sheet from '../Sheet.vue'
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE, useSidebar } from './context'

const props = withDefaults(
  defineProps<{
    side?: 'left' | 'right'
    variant?: 'sidebar' | 'floating' | 'inset'
    collapsible?: 'offcanvas' | 'icon' | 'none'
    class?: string
  }>(),
  { side: 'left', variant: 'sidebar', collapsible: 'offcanvas' },
)

const sidebar = useSidebar()
const { t } = useUITranslation()

const collapsed = computed(() => sidebar.state === 'collapsed')
const gapClasses = computed(() => {
  if (props.variant === 'floating' || props.variant === 'inset') {
    return 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]!'
  }
  return 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)!'
})
const containerClasses = computed(() => {
  const side =
    props.side === 'left'
      ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[side=left]:border-r'
      : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] group-data-[side=right]:border-l'
  const chrome =
    props.variant === 'floating' || props.variant === 'inset'
      ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]!'
      : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)!'
  return cn(side, chrome, props.class)
})
</script>

<template>
  <div
    v-if="props.collapsible === 'none'"
    data-slot="sidebar"
    :class="
      cn('flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground', props.class)
    "
  >
    <slot />
  </div>

  <Sheet
    v-else-if="sidebar.isMobile"
    :open="sidebar.openMobile"
    :side="props.side"
    :title="t('sidebar.sheetTitle')"
    :show-close-button="false"
    class="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
    :style="{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE }"
    @update:open="sidebar.setOpenMobile"
  >
    <div class="flex h-full w-full flex-col">
      <slot />
    </div>
  </Sheet>

  <div
    v-else
    class="group peer hidden text-sidebar-foreground md:block"
    :data-state="sidebar.state"
    :data-collapsible="collapsed ? props.collapsible : ''"
    :data-variant="props.variant"
    :data-side="props.side"
    data-slot="sidebar"
  >
    <div
      data-slot="sidebar-gap"
      :class="
        cn(
          'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
          'group-data-[collapsible=offcanvas]:w-0',
          'group-data-[side=right]:rotate-180',
          gapClasses,
        )
      "
    ></div>
    <div
      data-slot="sidebar-container"
      :class="
        cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
          containerClasses,
        )
      "
      :style="{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON }"
    >
      <div
        data-sidebar="sidebar"
        data-slot="sidebar-inner"
        class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
