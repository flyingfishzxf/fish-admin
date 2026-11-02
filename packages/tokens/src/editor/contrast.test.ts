import { describe, expect, it } from 'vitest'

import raw from '../tokens.json'
import { contrastRatio, parseColor, relativeLuminance, wcagLevel } from './contrast'
import type { AccentDefinition, TokenDefinition } from './types'

const data = raw as { tokens: TokenDefinition[]; accents: AccentDefinition[] }
const tokens = new Map(data.tokens.map((token) => [token.cssVar, token]))

type Mode = 'light' | 'dark'

function highContrastValue(cssVar: string, mode: Mode, accent: AccentDefinition): string {
  const overrides = mode === 'light' ? accent.highContrastLight : accent.highContrastDark
  const override = overrides?.[cssVar]
  if (override) return override

  const token = tokens.get(cssVar)
  const value = token?.highContrast?.[mode] ?? token?.[mode] ?? token?.light
  if (!value) throw new Error(`missing high-contrast value for ${cssVar}`)
  return value
}

const pairs: Array<[string, string]> = [
  ['--foreground', '--background'],
  ['--card-foreground', '--card'],
  ['--popover-foreground', '--popover'],
  ['--muted-foreground', '--background'],
  ['--secondary-foreground', '--secondary'],
  ['--primary-foreground', '--primary'],
  ['--destructive-foreground', '--destructive'],
]

describe('contrastRatio', () => {
  it('returns 21:1 for black and white', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 5)
  })

  it('handles oklch, rgb and hsl input', () => {
    expect(contrastRatio('oklch(1 0 0)', 'oklch(0 0 0)')).toBeCloseTo(21, 1)
    expect(contrastRatio('rgb(255 255 255)', 'rgb(0 0 0)')).toBeCloseTo(21, 5)
    expect(contrastRatio('hsl(0 0% 100%)', 'hsl(0 0% 0%)')).toBeCloseTo(21, 5)
  })

  it('returns null for derived or translucent colors', () => {
    expect(contrastRatio('color-mix(in oklch, white 50%, black)', '#fff')).toBeNull()
    expect(contrastRatio('var(--foreground)', '#fff')).toBeNull()
    expect(contrastRatio('oklch(0 0 0 / 10%)', '#fff')).toBeNull()
    expect(contrastRatio('not-a-color', '#fff')).toBeNull()
  })

  it('maps ratios to WCAG levels', () => {
    expect(wcagLevel(21)).toBe('AAA')
    expect(wcagLevel(7)).toBe('AAA')
    expect(wcagLevel(4.6)).toBe('AA')
    expect(wcagLevel(3.1)).toBe('AA Large')
    expect(wcagLevel(2.9)).toBe('Fail')
  })
})

describe('parsed colors', () => {
  it('computes relative luminance at the endpoints', () => {
    expect(relativeLuminance(parseColor('#000')!)).toBeCloseTo(0, 6)
    expect(relativeLuminance(parseColor('#fff')!)).toBeCloseTo(1, 6)
  })

  it('expands shorthand hex', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(parseColor('#000')).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('high-contrast token contract', () => {
  for (const accent of data.accents) {
    for (const mode of ['light', 'dark'] as const) {
      for (const [foreground, background] of pairs) {
        it(`${accent.id} ${mode}: ${foreground} on ${background} reaches AAA`, () => {
          const ratio = contrastRatio(
            highContrastValue(foreground, mode, accent),
            highContrastValue(background, mode, accent),
          )
          expect(ratio, `${foreground} / ${background}`).not.toBeNull()
          expect(ratio!).toBeGreaterThanOrEqual(7)
        })
      }
    }
  }
})
