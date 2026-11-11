<script setup lang="ts">
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/vue'
import { Check, Monitor, Moon, Sun } from 'lucide-vue-next'
import type { Component } from 'vue'

import { THEME_MODES, type ThemeMode } from '../../config/theme'
import { useT } from '../../lib/i18n'
import { useThemeStore } from '../../stores/theme'

const MODE_ICONS: Record<ThemeMode, Component> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const t = useT('common')
const theme = useThemeStore()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="size-9" :aria-label="t('theme.toggle')">
        <Sun class="size-4 dark:hidden" />
        <Moon class="hidden size-4 dark:block" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-44">
      <DropdownMenuLabel>{{ t('theme.label') }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem v-for="option in THEME_MODES" :key="option" @select="theme.setMode(option)">
        <component :is="MODE_ICONS[option]" class="size-4" />
        {{ t(`theme.${option}`) }}
        <Check v-if="theme.mode === option" class="ms-auto size-4" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
