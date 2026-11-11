<script setup lang="ts">
import { useT } from '../../lib/i18n'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const t = useT('common')
const appVersion = __APP_VERSION__
</script>

<template>
  <div class="flex min-h-svh bg-background">
    <AppSidebar />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
