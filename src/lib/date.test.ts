import { describe, expect, it } from 'vitest'

import { formatDayDisplay, formatDayValue, parseDay } from '@/lib/date'

describe('date helpers', () => {
  it('parses strict YYYY-MM-DD values into local dates', () => {
    const date = parseDay('2026-03-10')

    expect(date).toBeInstanceOf(Date)
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(2)
    expect(date?.getDate()).toBe(10)
    expect(date?.getHours()).toBe(0)
    expect(date?.getMinutes()).toBe(0)
  })

  it('rejects missing and malformed values', () => {
    expect(parseDay()).toBeUndefined()
    expect(parseDay('')).toBeUndefined()
    expect(parseDay('2026-3-10')).toBeUndefined()
    expect(parseDay('03/10/2026')).toBeUndefined()
    expect(parseDay('2026-03-10T00:00:00')).toBeUndefined()
    expect(parseDay('not-a-date')).toBeUndefined()
  })

  it('serializes local calendar days without padding drift', () => {
    expect(formatDayValue(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(formatDayValue(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('round-trips a day without timezone drift', () => {
    for (const value of ['2026-01-01', '2026-03-10', '2026-12-31']) {
      const date = parseDay(value)
      expect(date).toBeDefined()
      expect(formatDayValue(date as Date)).toBe(value)
    }
  })

  it('formats days with locale-aware defaults', () => {
    expect(formatDayDisplay('2026-03-10', 'en')).toBe('Mar 10, 2026')
    expect(formatDayDisplay('2026-03-10', 'zh-CN')).toBe('2026年3月10日')
  })

  it('supports custom Intl options and invalid values', () => {
    expect(formatDayDisplay('2026-03-10', 'en', { year: 'numeric' })).toBe('2026')
    expect(formatDayDisplay(undefined, 'en')).toBeUndefined()
    expect(formatDayDisplay('2026-3-10', 'en')).toBeUndefined()
  })
})
