export const SHELL_LAYOUTS = ['sidebar', 'header', 'mixed'] as const
export type ShellLayout = (typeof SHELL_LAYOUTS)[number]
export const DEFAULT_SHELL_LAYOUT: ShellLayout = 'sidebar'

export const SHELL_DENSITIES = ['default', 'compact'] as const
export type ShellDensity = (typeof SHELL_DENSITIES)[number]
export const DEFAULT_SHELL_DENSITY: ShellDensity = 'default'

export const SHELL_CONTENT_WIDTHS = ['contained', 'wide', 'full'] as const
export type ShellContentWidth = (typeof SHELL_CONTENT_WIDTHS)[number]
export const DEFAULT_CONTENT_WIDTH: ShellContentWidth = 'contained'

// Same storage envelope as the React store so a browser that has used both
// templates keeps one set of preferences instead of two.
export const UI_STORAGE_KEY = 'fish-admin:ui'

export const SHELL_LAYOUT_OPTIONS = [
  {
    value: 'sidebar',
    labelKey: 'settings:shell.layouts.sidebar',
    descriptionKey: 'settings:shell.layouts.sidebarHint',
  },
  {
    value: 'header',
    labelKey: 'settings:shell.layouts.header',
    descriptionKey: 'settings:shell.layouts.headerHint',
  },
  {
    value: 'mixed',
    labelKey: 'settings:shell.layouts.mixed',
    descriptionKey: 'settings:shell.layouts.mixedHint',
  },
] as const satisfies readonly { value: ShellLayout; labelKey: string; descriptionKey: string }[]

export const SHELL_DENSITY_OPTIONS = [
  {
    value: 'default',
    labelKey: 'settings:shell.densities.default',
    descriptionKey: 'settings:shell.densities.defaultHint',
  },
  {
    value: 'compact',
    labelKey: 'settings:shell.densities.compact',
    descriptionKey: 'settings:shell.densities.compactHint',
  },
] as const satisfies readonly { value: ShellDensity; labelKey: string; descriptionKey: string }[]

export const SHELL_CONTENT_WIDTH_OPTIONS = [
  {
    value: 'contained',
    labelKey: 'settings:shell.contentWidths.contained',
    descriptionKey: 'settings:shell.contentWidths.containedHint',
    className: 'max-w-7xl',
  },
  {
    value: 'wide',
    labelKey: 'settings:shell.contentWidths.wide',
    descriptionKey: 'settings:shell.contentWidths.wideHint',
    className: 'max-w-[1600px]',
  },
  {
    value: 'full',
    labelKey: 'settings:shell.contentWidths.full',
    descriptionKey: 'settings:shell.contentWidths.fullHint',
    className: 'max-w-none',
  },
] as const satisfies readonly {
  value: ShellContentWidth
  labelKey: string
  descriptionKey: string
  className: string
}[]

/** One entry of the tab workbench: a reachable route plus the query it was left on. */
export interface ShellTab {
  to: string
  search?: Record<string, string>
  pinned: boolean
}

export interface StoredShellState {
  layout: ShellLayout
  density: ShellDensity
  contentWidth: ShellContentWidth
  tabs: ShellTab[]
}

export function isShellLayout(value: unknown): value is ShellLayout {
  return typeof value === 'string' && (SHELL_LAYOUTS as readonly string[]).includes(value)
}

export function isShellDensity(value: unknown): value is ShellDensity {
  return typeof value === 'string' && (SHELL_DENSITIES as readonly string[]).includes(value)
}

export function isContentWidth(value: unknown): value is ShellContentWidth {
  return typeof value === 'string' && (SHELL_CONTENT_WIDTHS as readonly string[]).includes(value)
}

export function contentWidthClass(width: ShellContentWidth): string {
  return (
    SHELL_CONTENT_WIDTH_OPTIONS.find((option) => option.value === width)?.className ?? 'max-w-7xl'
  )
}

function readSearch(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const search: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && entry !== '') search[key] = entry
  }
  return Object.keys(search).length > 0 ? search : undefined
}

function readTabs(value: unknown): ShellTab[] {
  if (!Array.isArray(value)) return []
  const tabs: ShellTab[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as { to?: unknown; search?: unknown; pinned?: unknown }
    if (typeof candidate.to !== 'string' || typeof candidate.pinned !== 'boolean') continue
    if (seen.has(candidate.to)) continue
    seen.add(candidate.to)
    const search = readSearch(candidate.search)
    tabs.push(
      search
        ? { to: candidate.to, search, pinned: candidate.pinned }
        : { to: candidate.to, pinned: candidate.pinned },
    )
  }
  return tabs
}

/**
 * Reads the persisted shell preferences the way the theme store reads its own:
 * a missing or invalid field falls back on its own instead of discarding the
 * whole record, and the version is deliberately not bumped — a user should not
 * lose layout, density, width and tabs because one field was added.
 */
export function readStoredUi(storage: Pick<Storage, 'getItem'> = localStorage): StoredShellState {
  const fallback: StoredShellState = {
    layout: DEFAULT_SHELL_LAYOUT,
    density: DEFAULT_SHELL_DENSITY,
    contentWidth: DEFAULT_CONTENT_WIDTH,
    tabs: [],
  }
  try {
    const raw = storage.getItem(UI_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
    const state = parsed.state ?? {}
    return {
      layout: isShellLayout(state.layout) ? state.layout : fallback.layout,
      density: isShellDensity(state.density) ? state.density : fallback.density,
      contentWidth: isContentWidth(state.contentWidth) ? state.contentWidth : fallback.contentWidth,
      tabs: readTabs(state.tabs),
    }
  } catch {
    return fallback
  }
}
