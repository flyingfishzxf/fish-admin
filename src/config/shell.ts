export const SHELL_LAYOUTS = ['sidebar', 'header', 'mixed'] as const

export type ShellLayout = (typeof SHELL_LAYOUTS)[number]

export const SHELL_DENSITIES = ['default', 'compact'] as const

export type ShellDensity = (typeof SHELL_DENSITIES)[number]

export const SHELL_CONTENT_WIDTHS = ['contained', 'wide', 'full'] as const

export type ShellContentWidth = (typeof SHELL_CONTENT_WIDTHS)[number]

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

export function contentWidthClass(width: ShellContentWidth): string {
  return (
    SHELL_CONTENT_WIDTH_OPTIONS.find((option) => option.value === width)?.className ?? 'max-w-7xl'
  )
}
