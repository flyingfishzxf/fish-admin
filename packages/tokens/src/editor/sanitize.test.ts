import { describe, expect, it } from 'vitest'

import { sanitizeTheme } from './sanitize'
import type { ThemeManifest } from './types'

const manifest = {
  tokens: [
    { cssVar: '--background', type: 'color' },
    { cssVar: '--primary', type: 'color' },
    { cssVar: '--radius', type: 'length' },
    { cssVar: '--motion-duration-base', type: 'duration' },
    { cssVar: '--motion-ease-standard', type: 'easing' },
  ],
} as Pick<ThemeManifest, 'tokens'>

describe('sanitizeTheme', () => {
  it('keeps declared tokens with valid values', () => {
    expect(
      sanitizeTheme(
        {
          light: {
            '--background': 'oklch(1 0 0)',
            '--primary': 'var(--background)',
            '--radius': '1rem',
            '--motion-duration-base': '240ms',
            '--motion-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
          },
          dark: { '--background': '#0a0a0a' },
        },
        manifest,
      ),
    ).toEqual({
      light: {
        '--background': 'oklch(1 0 0)',
        '--primary': 'var(--background)',
        '--radius': '1rem',
        '--motion-duration-base': '240ms',
        '--motion-ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      dark: { '--background': '#0a0a0a' },
    })
  })

  it('drops unknown tokens, wrong types and injection payloads', () => {
    expect(
      sanitizeTheme(
        {
          light: {
            '--unknown': 'oklch(1 0 0)',
            '--background': 'red; background-image: url(https://evil.test)',
            '--primary': 'var(--unknown)',
            '--radius': '1rem; color: red',
            '--motion-duration-base': 'fast',
            '--motion-ease-standard': 'steps(2)',
            '--foreground': 42,
          },
          dark: [],
        },
        manifest,
      ),
    ).toEqual({ light: {}, dark: {} })
  })

  it('ignores malformed snapshots', () => {
    expect(sanitizeTheme(null, manifest)).toEqual({ light: {}, dark: {} })
    expect(sanitizeTheme('theme', manifest)).toEqual({ light: {}, dark: {} })
    expect(sanitizeTheme({ light: ['--background'] }, manifest)).toEqual({
      light: {},
      dark: {},
    })
  })

  it('trims surrounding whitespace before validating', () => {
    expect(
      sanitizeTheme({ light: { '--background': '  #fff  ' }, dark: {} }, manifest).light,
    ).toEqual({ '--background': '#fff' })
  })
})
