import { describe, expect, it } from 'vitest'

import { formatDayDisplay, formatDayValue, parseDay } from './date'

describe('shared date helpers', () => {
  it('parses only well-formed day values', () => {
    expect(parseDay('2026-10-27')?.getTime()).toBe(new Date(2026, 9, 27).getTime())
    expect(parseDay('2026-1-1')).toBeUndefined()
    expect(parseDay('not-a-date')).toBeUndefined()
    expect(parseDay(undefined)).toBeUndefined()
  })

  it('serialises the local calendar day', () => {
    expect(formatDayValue(new Date(2026, 9, 27))).toBe('2026-10-27')
  })

  it('formats for both shipped languages', () => {
    expect(formatDayDisplay('2026-10-27', 'en-US')).toBe('Oct 27, 2026')
    expect(formatDayDisplay('2026-10-27', 'zh-CN')).toBe('2026年10月27日')
  })
})
