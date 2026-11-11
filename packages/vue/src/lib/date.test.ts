import { describe, expect, it } from 'vitest'

import { formatDayDisplay, formatDayValue, parseDay } from './date'

describe('date helpers', () => {
  it('parses only strict YYYY-MM-DD values', () => {
    expect(parseDay('2026-09-28')?.getFullYear()).toBe(2026)
    expect(parseDay('2026-9-28')).toBeUndefined()
    expect(parseDay('28/09/2026')).toBeUndefined()
    expect(parseDay(undefined)).toBeUndefined()
  })

  it('serializes a local date without a timezone shift', () => {
    expect(formatDayValue(new Date(2026, 8, 28))).toBe('2026-09-28')
  })

  it('formats a value for the given language', () => {
    expect(formatDayDisplay('2026-09-28', 'en')).toBe('Sep 28, 2026')
    expect(formatDayDisplay('not-a-date', 'en')).toBeUndefined()
  })
})
