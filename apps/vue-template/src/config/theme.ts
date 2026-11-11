export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]
export type Accent = 'violet'
export const STORAGE_KEY = 'fish-admin:theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> = localStorage) {
  const fallback = { mode: 'system' as ThemeMode, accent: 'violet' as Accent }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { state?: { mode?: unknown } }
    return {
      mode: isThemeMode(parsed.state?.mode) ? parsed.state.mode : fallback.mode,
      accent: fallback.accent,
    }
  } catch {
    return fallback
  }
}

export function applyTheme(mode: ThemeMode, accent: Accent = 'violet') {
  if (typeof window === 'undefined') return
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  const root = document.documentElement

  root.classList.toggle('dark', isDark)
  root.dataset.accent = accent
  root.style.colorScheme = isDark ? 'dark' : 'light'
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? '#191820' : '#fcfbfd')
}
