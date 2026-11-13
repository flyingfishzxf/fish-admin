export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

// `violet` is the root palette; the other four ship as `[data-accent='…']`
// blocks in `packages/tokens/dist/tokens.css`.
export const ACCENTS = ['violet', 'cyan', 'emerald', 'orange', 'rose'] as const
export type Accent = (typeof ACCENTS)[number]
export const DEFAULT_ACCENT: Accent = 'violet'

export const STORAGE_KEY = 'fish-admin:theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
}

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value)
}

export function readStoredTheme(storage: Pick<Storage, 'getItem'> = localStorage) {
  const fallback = { mode: 'system' as ThemeMode, accent: DEFAULT_ACCENT }
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { state?: { mode?: unknown; accent?: unknown } }
    return {
      mode: isThemeMode(parsed.state?.mode) ? parsed.state.mode : fallback.mode,
      // Sessions stored before the five-palette change carry no accent; falling
      // back keeps them working instead of forcing a storage migration.
      accent: isAccent(parsed.state?.accent) ? parsed.state.accent : fallback.accent,
    }
  } catch {
    return fallback
  }
}

export function applyTheme(mode: ThemeMode, accent: Accent = DEFAULT_ACCENT) {
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
