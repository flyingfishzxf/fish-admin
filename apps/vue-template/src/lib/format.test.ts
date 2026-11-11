import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPercent, formatRelativeTime } from './format'

describe('format', () => {
  it('uses the zh-CN locale for zh languages', () => {
    expect(formatDate('2026-11-11T00:00:00Z', 'zh-CN', { dateStyle: 'medium' })).toContain('2026')
    expect(formatCurrency(1200, 'en')).toBe('$1,200')
    expect(formatPercent(12.34, 'en')).toBe('12.3%')
  })

  it('formats relative time with Intl.RelativeTimeFormat', () => {
    expect(formatRelativeTime(Date.now() - 60_000, 'en')).toContain('minute')
  })
})
