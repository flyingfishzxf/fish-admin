import { useEffect } from 'react'

import { applyTheme } from '@/lib/theme'
import { useThemeStore } from '@/stores/theme-store'

export function ThemeSync() {
  const mode = useThemeStore((state) => state.mode)
  const accent = useThemeStore((state) => state.accent)

  useEffect(() => {
    applyTheme(mode, accent)
  }, [mode, accent])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const state = useThemeStore.getState()
      applyTheme(state.mode, state.accent)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return null
}
