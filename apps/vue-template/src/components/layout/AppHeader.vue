<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { PanelLeft } from 'lucide-vue-next'

import { useT } from '../../lib/i18n'
import { useUiStore } from '../../stores/ui'
import AppBreadcrumbs from './AppBreadcrumbs.vue'
import LanguageToggle from './LanguageToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserMenu from './UserMenu.vue'

const t = useT('common')
const ui = useUiStore()

function toggleSidebar() {
  if (window.matchMedia('(min-width: 1024px)').matches) ui.toggleCollapsed()
  else ui.openMobile()
}
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6"
  >
    <Button
      id="sidebar-trigger"
      variant="ghost"
      size="icon"
      class="-ms-1.5 size-9"
      :aria-label="t('header.toggleSidebar')"
      @click="toggleSidebar"
    >
      <PanelLeft class="size-4" />
    </Button>
    <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
    <AppBreadcrumbs />
    <div class="ms-auto flex items-center gap-0.5 sm:gap-1">
      <ThemeToggle />
      <LanguageToggle />
      <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
      <UserMenu />
    </div>
  </header>
</template>
