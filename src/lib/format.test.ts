import { describe, expect, it } from 'vitest'

import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '@/lib/format'

const timestamp = new Date('2026-10-21T12:00:00.000Z')

describe('format helpers', () => {
  it('formats numbers per locale and falls back to English', () => {
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5')
    expect(formatNumber(1234.5, 'fr')).toBe('1,234.5')
    expect(formatNumber(1234.5, 'zh-CN')).toBe('1,234.5')
  })

  it('formats compact numbers', () => {
    expect(formatCompactNumber(12_000, 'en')).toBe('12K')
  })

  it('formats currency without decimals by default', () => {
    expect(formatCurrency(1234.56, 'en')).toBe('$1,235')
  })

  it('formats percentages with one decimal', () => {
    expect(formatPercent(12.34, 'en')).toBe('12.3%')
    expect(formatPercent(100, 'en')).toBe('100%')
  })

  it('formats dates with the requested options', () => {
    expect(formatDate(timestamp, 'en', { year: 'numeric' })).toBe('2026')
    expect(formatDate(timestamp, 'zh-CN', { year: 'numeric' })).toBe('2026年')
  })

  it('formats relative time in the past and future', () => {
    const now = Date.now()

    expect(formatRelativeTime(now - 60 * 60 * 1000, 'en')).toContain('hour ago')
    expect(formatRelativeTime(now + 2 * 24 * 60 * 60 * 1000, 'en')).toContain('2 days')
  })
})
