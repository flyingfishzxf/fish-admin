import { describe, expect, it } from 'vitest'

import { decodeTheme, encodeTheme, themeToCss } from './serialize'
import type { ThemeSnapshot } from './types'

const theme: ThemeSnapshot = {
  light: {
    '--background': 'oklch(1 0 0)',
    '--primary': 'oklch(0.57 0.235 292.5)',
  },
  dark: {
    '--background': '#0a0a0a',
  },
}

describe('encodeTheme / decodeTheme', () => {
  it('round-trips a snapshot through a URL-safe string', () => {
    const encoded = encodeTheme(theme)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeTheme(encoded)).toEqual(theme)
  })

  it('rejects empty, malformed, oversized or non-json input', () => {
    expect(decodeTheme('')).toBeNull()
    expect(decodeTheme(null)).toBeNull()
    expect(decodeTheme('not-base64!')).toBeNull()
    expect(decodeTheme('x'.repeat(5000))).toBeNull()
    expect(decodeTheme(btoa('not json'))).toBeNull()
  })
})

describe('themeToCss', () => {
  it('emits root and dark blocks in order', () => {
    expect(themeToCss(theme)).toBe(
      [
        ':root {',
        '  --background: oklch(1 0 0);',
        '  --primary: oklch(0.57 0.235 292.5);',
        '}',
        '',
        '.dark {',
        '  --background: #0a0a0a;',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('omits empty blocks', () => {
    expect(themeToCss({ light: {}, dark: {} })).toBe('\n')
    expect(themeToCss({ light: { '--radius': '1rem' }, dark: {} })).toBe(
      ':root {\n  --radius: 1rem;\n}\n',
    )
  })
})
