<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'

import { contentWidthClass } from '../../config/shell'
import { useT } from '../../lib/i18n'
import { useUiStore } from '../../stores/ui'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppTopNav from './AppTopNav.vue'

const t = useT('common')
const ui = useUiStore()
const appVersion = __APP_VERSION__

// The `header` layout has no sidebar at all; the other two share one.
const showSidebar = computed(() => ui.layout !== 'header')
const mainWidth = computed(() => contentWidthClass(ui.contentWidth))

// Density lives on <html> so the compact spacing scale also reaches portalled
// overlays, which are rendered outside this tree.
watch(
  () => ui.density,
  (density) => {
    document.documentElement.dataset.density = density
  },
  { immediate: true },
)

// `mixed` is the icon-rail layout: it starts collapsed, and switching back to a
// full-height rail restores the expanded state so the user is never stuck.
watch(
  () => ui.layout,
  (layout) => {
    ui.setCollapsed(layout === 'mixed')
  },
  { immediate: true },
)

function onKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'b') return
  // No sidebar in the header layout, so the shortcut has nothing to act on.
  if (ui.layout === 'header') return
  event.preventDefault()
  ui.toggleCollapsed()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex min-h-svh bg-background">
    <AppSidebar v-if="showSidebar" />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopNav v-if="ui.layout === 'header'" />
      <AppHeader v-else />
      <main class="mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" :class="mainWidth">
        <slot />
      </main>
      <footer
        class="mt-auto flex flex-col gap-1 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <span>{{ t('footer.builtWithVue') }}</span>
        <span>{{ appVersion }} · {{ t('footer.license') }}</span>
      </footer>
    </div>
  </div>
</template>
