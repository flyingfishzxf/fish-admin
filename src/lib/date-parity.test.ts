import { describe, expect, it } from 'vitest'

import * as contractDate from '@fish-admin/contracts/date'
import * as uiDate from '@fish-admin/react/internal/date'

const VALUES = [undefined, '', '2024-02-29', '2024-13-01', '2024-02-30', '0000-01-01', '2026-10-27']
const DATE = new Date(2026, 9, 27)

describe('shared date helpers', () => {
  it('matches the component package implementation', () => {
    for (const value of VALUES) {
      expect(contractDate.parseDay(value)?.getTime(), String(value)).toBe(
        uiDate.parseDay(value)?.getTime(),
      )
      expect(contractDate.formatDayDisplay(value, 'en-US')).toBe(
        uiDate.formatDayDisplay(value, 'en-US'),
      )
      expect(contractDate.formatDayDisplay(value, 'zh-CN')).toBe(
        uiDate.formatDayDisplay(value, 'zh-CN'),
      )
    }

    expect(contractDate.formatDayValue(DATE)).toBe(uiDate.formatDayValue(DATE))
  })
})
