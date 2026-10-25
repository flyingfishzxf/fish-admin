import { describe, expect, it } from 'vitest'

import { buildReport, REPORT_CHANNEL_KEYS } from './reports'

const DAY_RANGE = { from: '2026-10-01', to: '2026-10-31', granularity: 'day' as const }

describe('report generator', () => {
  it('is deterministic for the same range', () => {
    const first = buildReport(DAY_RANGE)
    const second = buildReport(DAY_RANGE)

    expect(second).toEqual(first)
  })

  it('produces one daily point per day and five rows per point', () => {
    const report = buildReport(DAY_RANGE)

    expect(report.series).toHaveLength(31)
    expect(report.series[0]).toMatchObject({ date: '2026-10-01', days: 1 })
    expect(report.series[30]).toMatchObject({ date: '2026-10-31', days: 1 })
    expect(report.rows).toHaveLength(31 * REPORT_CHANNEL_KEYS.length)
  })

  it('groups weekly buckets starting on Monday', () => {
    const report = buildReport({ ...DAY_RANGE, granularity: 'week' })

    expect(report.series.map((point) => point.date)).toEqual([
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ])
    expect(report.series.map((point) => point.days)).toEqual([4, 7, 7, 7, 6])
  })

  it('groups monthly buckets across a month boundary', () => {
    const report = buildReport({ from: '2026-09-15', to: '2026-10-15', granularity: 'month' })

    expect(report.series.map((point) => point.date)).toEqual(['2026-09-01', '2026-10-01'])
    expect(report.series.map((point) => point.days)).toEqual([16, 15])
  })

  it('keeps series, channel and row totals consistent', () => {
    const report = buildReport(DAY_RANGE)
    const seriesRevenue = report.series.reduce((sum, point) => sum + point.revenue, 0)
    const seriesOrders = report.series.reduce((sum, point) => sum + point.orders, 0)
    const rowRevenue = report.rows.reduce((sum, row) => sum + row.revenue, 0)
    const rowOrders = report.rows.reduce((sum, row) => sum + row.orders, 0)
    const channelRevenue = report.channels.reduce((sum, channel) => sum + channel.value, 0)

    expect(channelRevenue).toBe(seriesRevenue)
    expect(rowRevenue).toBe(seriesRevenue)
    expect(rowOrders).toBe(seriesOrders)
    expect(report.kpis.find((kpi) => kpi.id === 'revenue')?.value).toBe(seriesRevenue)
    expect(report.kpis.find((kpi) => kpi.id === 'orders')?.value).toBe(seriesOrders)
    expect(report.channels.map((channel) => channel.name)).toEqual([...REPORT_CHANNEL_KEYS])
  })

  it('rejects malformed dates', () => {
    expect(() => buildReport({ from: '2026-9-1', to: '2026-10-31', granularity: 'day' })).toThrow()
  })
})
