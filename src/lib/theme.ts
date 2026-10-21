import { useEffect, useState } from 'react'

import type { Accent, ThemeMode } from '@/config/theme'
import { useThemeStore } from '@/stores/theme-store'

export function applyTheme(mode: ThemeMode, accent: Accent) {
  if (typeof window === 'undefined') return

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  const root = document.documentElement

  root.classList.toggle('dark', isDark)
  root.dataset.accent = accent
  root.style.colorScheme = isDark ? 'dark' : 'light'

  const themeColor = document.querySelector('meta[name="theme-color"]')
  themeColor?.setAttribute('content', isDark ? '#191820' : '#fcfbfd')
}

export function useResolvedTheme(): 'light' | 'dark' {
  const mode = useThemeStore((state) => state.mode)
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemDark(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (mode === 'system') return systemDark ? 'dark' : 'light'
  return mode
}
