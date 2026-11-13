import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  applyTheme,
  readStoredTheme,
  STORAGE_KEY,
  type Accent,
  type ThemeMode,
} from '../config/theme'

export const useThemeStore = defineStore('theme', () => {
  const stored = readStoredTheme()
  const mode = ref<ThemeMode>(stored.mode)
  const accent = ref<Accent>(stored.accent)
  const systemDark = ref(false)
  let media: MediaQueryList | null = null

  const resolvedMode = computed<'light' | 'dark'>(() =>
    mode.value === 'system' ? (systemDark.value ? 'dark' : 'light') : mode.value,
  )

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: mode.value, accent: accent.value }, version: 1 }),
    )
  }

  function apply() {
    applyTheme(resolvedMode.value, accent.value)
  }

  function handleChange(event: MediaQueryListEvent) {
    systemDark.value = event.matches
    apply()
  }

  function setMode(next: ThemeMode) {
    mode.value = next
    persist()
    apply()
  }

  function setAccent(next: Accent) {
    accent.value = next
    persist()
    apply()
  }

  function init() {
    media = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = media.matches
    media.addEventListener('change', handleChange)
    apply()
  }

  function dispose() {
    media?.removeEventListener('change', handleChange)
    media = null
  }

  return { mode, accent, systemDark, resolvedMode, setMode, setAccent, init, dispose }
})
