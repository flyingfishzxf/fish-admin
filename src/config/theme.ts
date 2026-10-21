export const THEME_MODES = ['light', 'dark', 'system'] as const

export type ThemeMode = (typeof THEME_MODES)[number]

export const ACCENTS = [
  {
    value: 'violet',
    labelKey: 'settings:appearance.accents.violet',
    swatch: 'oklch(0.585 0.235 292.5)',
  },
  {
    value: 'cyan',
    labelKey: 'settings:appearance.accents.cyan',
    swatch: 'oklch(0.63 0.14 205)',
  },
  {
    value: 'emerald',
    labelKey: 'settings:appearance.accents.emerald',
    swatch: 'oklch(0.6 0.14 160)',
  },
  {
    value: 'orange',
    labelKey: 'settings:appearance.accents.orange',
    swatch: 'oklch(0.68 0.18 55)',
  },
  {
    value: 'rose',
    labelKey: 'settings:appearance.accents.rose',
    swatch: 'oklch(0.62 0.22 10)',
  },
] as const

export type Accent = (typeof ACCENTS)[number]['value']
