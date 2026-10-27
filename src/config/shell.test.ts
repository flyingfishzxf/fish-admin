import { describe, expect, it } from 'vitest'

import {
  contentWidthClass,
  SHELL_CONTENT_WIDTH_OPTIONS,
  SHELL_CONTENT_WIDTHS,
  SHELL_DENSITIES,
  SHELL_DENSITY_OPTIONS,
  SHELL_LAYOUT_OPTIONS,
  SHELL_LAYOUTS,
} from '@/config/shell'

// Discovered rather than listed, the way nav.test.ts does it, so a scaffolded
// copy that keeps one locale still checks its copy.
const settingsResources = Object.values(
  import.meta.glob('../locales/*/settings.json', { eager: true, import: 'default' }) as Record<
    string,
    Record<string, unknown>
  >,
)

function lookup(source: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment]
    }
    return undefined
  }, source)
}

const ROWS = [
  { row: 'layout', section: 'layouts', values: SHELL_LAYOUTS, options: SHELL_LAYOUT_OPTIONS },
  { row: 'density', section: 'densities', values: SHELL_DENSITIES, options: SHELL_DENSITY_OPTIONS },
  {
    row: 'contentWidth',
    section: 'contentWidths',
    values: SHELL_CONTENT_WIDTHS,
    options: SHELL_CONTENT_WIDTH_OPTIONS,
  },
] as const

describe('shell config', () => {
  it('offers every declared choice exactly once', () => {
    for (const { values, options } of ROWS) {
      expect(options.map((option) => option.value)).toEqual([...values])
    }
  })

  it('has copy for every row and option in each locale', () => {
    expect(settingsResources.length).toBeGreaterThan(0)
    for (const resource of settingsResources) {
      for (const { row, options } of ROWS) {
        expect(typeof lookup(resource, `shell.${row}`)).toBe('string')
        expect(typeof lookup(resource, `shell.${row}Description`)).toBe('string')
        for (const option of options) {
          const label = lookup(resource, option.labelKey.replace(/^settings:/, ''))
          const hint = lookup(resource, option.descriptionKey.replace(/^settings:/, ''))
          expect(typeof label).toBe('string')
          expect(typeof hint).toBe('string')
        }
      }
    }
  })

  it('maps every content width to a max-width class', () => {
    expect(contentWidthClass('contained')).toBe('max-w-7xl')
    expect(contentWidthClass('wide')).toBe('max-w-[1600px]')
    expect(contentWidthClass('full')).toBe('max-w-none')
  })
})
