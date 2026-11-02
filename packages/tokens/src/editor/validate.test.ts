import { describe, expect, it } from 'vitest'

import {
  isSafeValue,
  isTokenName,
  isValidColorValue,
  isValidDurationValue,
  isValidEasingValue,
  isValidLengthValue,
  isValidValueForType,
} from './validate'

describe('isTokenName', () => {
  it('accepts kebab-case token names', () => {
    expect(isTokenName('background')).toBe(true)
    expect(isTokenName('motion-duration-fast')).toBe(true)
  })

  it('rejects names that are not lowercase kebab-case', () => {
    expect(isTokenName('Background')).toBe(false)
    expect(isTokenName('-background')).toBe(false)
    expect(isTokenName('--background')).toBe(false)
    expect(isTokenName('background color')).toBe(false)
  })
})

describe('isSafeValue', () => {
  it('accepts the CSS functions used by the contract', () => {
    expect(isSafeValue('oklch(0.57 0.235 292.5)')).toBe(true)
    expect(isSafeValue('color-mix(in oklch, var(--primary) 9%, var(--background))')).toBe(true)
    expect(isSafeValue('cubic-bezier(0.2, 0, 0, 1)')).toBe(true)
  })

  it('rejects declaration escapes and markup', () => {
    expect(isSafeValue('red; color: blue')).toBe(false)
    expect(isSafeValue('red} body { color: red')).toBe(false)
    expect(isSafeValue('</style><script>alert(1)</script>')).toBe(false)
    expect(isSafeValue('url(https://example.com/x.png)')).toBe(false)
    expect(isSafeValue('expression(alert(1))')).toBe(false)
    expect(isSafeValue('var(--background)\\')).toBe(false)
    expect(isSafeValue('')).toBe(false)
  })
})

describe('isValidColorValue', () => {
  const allowed = new Set(['--primary', '--background'])

  it('accepts hex, oklch, rgb, hsl and known variables', () => {
    expect(isValidColorValue('#fff', allowed)).toBe(true)
    expect(isValidColorValue('#0f0f0f80', allowed)).toBe(true)
    expect(isValidColorValue('oklch(0.57 0.235 292.5)', allowed)).toBe(true)
    expect(isValidColorValue('oklch(1 0 0 / 10%)', allowed)).toBe(true)
    expect(isValidColorValue('rgb(124 58 237)', allowed)).toBe(true)
    expect(isValidColorValue('hsl(270 75% 60%)', allowed)).toBe(true)
    expect(isValidColorValue('var(--primary)', allowed)).toBe(true)
  })

  it('rejects unknown variables and unsupported functions', () => {
    expect(isValidColorValue('var(--secret)', allowed)).toBe(false)
    expect(isValidColorValue('color-mix(in oklch, var(--primary) 9%, white)', allowed)).toBe(false)
    expect(isValidColorValue('url(#x)', allowed)).toBe(false)
    expect(isValidColorValue('red', allowed)).toBe(false)
  })
})

describe('typed values', () => {
  it('validates lengths', () => {
    expect(isValidLengthValue('0.75rem')).toBe(true)
    expect(isValidLengthValue('4px')).toBe(true)
    expect(isValidLengthValue('0')).toBe(true)
    expect(isValidLengthValue('calc(1rem + 2px)')).toBe(false)
    expect(isValidLengthValue('0.75rem; color: red')).toBe(false)
  })

  it('validates durations', () => {
    expect(isValidDurationValue('200ms')).toBe(true)
    expect(isValidDurationValue('0.3s')).toBe(true)
    expect(isValidDurationValue('0')).toBe(true)
    expect(isValidDurationValue('fast')).toBe(false)
  })

  it('validates easings', () => {
    expect(isValidEasingValue('ease-in-out')).toBe(true)
    expect(isValidEasingValue('cubic-bezier(0.2, 0, 0, 1)')).toBe(true)
    expect(isValidEasingValue('cubic-bezier(0.25, 1.15, 0.35, 1)')).toBe(true)
    expect(isValidEasingValue('steps(4)')).toBe(false)
  })

  it('dispatches by token type', () => {
    const allowed = new Set(['--primary'])
    expect(isValidValueForType('color', 'var(--primary)', allowed)).toBe(true)
    expect(isValidValueForType('length', '1rem', allowed)).toBe(true)
    expect(isValidValueForType('duration', '150ms', allowed)).toBe(true)
    expect(isValidValueForType('easing', 'ease-out', allowed)).toBe(true)
    expect(isValidValueForType('color', '1rem', allowed)).toBe(false)
    expect(isValidValueForType('duration', 'red', allowed)).toBe(false)
  })
})
