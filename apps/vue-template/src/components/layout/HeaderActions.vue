<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import { Search } from 'lucide-vue-next'

import { useT } from '../../lib/i18n'
import { useUiStore } from '../../stores/ui'
import LanguageToggle from './LanguageToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserMenu from './UserMenu.vue'

const t = useT('common')
const ui = useUiStore()
</script>

<template>
  <div class="ms-auto flex items-center gap-0.5 sm:gap-1">
    <Button
      variant="ghost"
      size="sm"
      data-tour="search"
      class="gap-2 text-muted-foreground"
      :aria-label="t('header.openCommand')"
      @click="ui.setCommandOpen(true)"
    >
      <Search class="size-4" />
      <span class="hidden md:inline">{{ t('header.search') }}</span>
      <kbd
        class="hidden rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium md:inline"
      >
        {{ t('command.shortcut') }}
      </kbd>
    </Button>
    <ThemeToggle />
    <LanguageToggle />
    <span class="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
    <UserMenu />
  </div>
</template>
