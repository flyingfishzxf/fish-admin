import type { ReportData } from '@fish-admin/contracts'
import { DropdownMenuItem, Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadCsv } from '../../lib/csv'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchReports } from './api'
import ReportsPage from './ReportsPage.vue'

vi.mock('./api', () => ({ fetchReports: vi.fn() }))
vi.mock('../../lib/csv', () => ({ downloadCsv: vi.fn(), toCsv: vi.fn() }))

function reportRow(index: number): ReportData['rows'][number] {
  return {
    id: `row-${index}`,
    date: '2026-01-15',
    channel: 'direct',
    revenue: 100 + index,
    orders: 3,
    refunds: 2,
  }
}

function makeReport(
  rows: ReportData['rows'] = [],
  overrides: Partial<ReportData> = {},
): ReportData {
  return {
    from: '2026-01-01',
    to: '2026-01-30',
    granularity: 'day',
    kpis: [
      { id: 'revenue', value: 12345, change: 8.2 },
      { id: 'orders', value: 150, change: -2.1 },
      { id: 'conversion', value: 3.4, change: 0.5 },
      { id: 'refunds', value: 200, change: 1 },
    ],
    series: [],
    channels: [],
    rows,
    generatedAt: '2026-01-30T00:00:00.000Z',
    ...overrides,
  }
}

/** A report with the series and channels the two charts need. */
function chartReport(): ReportData {
  return makeReport([reportRow(1)], {
    series: [
      { date: '2026-01-01', revenue: 3200, orders: 32, days: 1 },
      { date: '2026-01-02', revenue: 4800, orders: 48, days: 1 },
      { date: '2026-01-03', revenue: 4100, orders: 41, days: 1 },
    ],
    channels: [
      { name: 'direct', value: 6000 },
      { name: 'organic', value: 4000 },
    ],
  })
}

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(ReportsPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function lastParams() {
  const calls = vi.mocked(fetchReports).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls.at(-1)![0]
}

function spanInDays(params: { from?: string; to?: string }) {
  return (Date.parse(params.to!) - Date.parse(params.from!)) / 86_400_000
}

describe('ReportsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchReports).mockResolvedValue(makeReport([reportRow(1)]))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders highlights and requests the default 30-day daily range', async () => {
    const page = mountPage()
    // `Highlights` is static; wait for a rendered row so the query has settled.
    await vi.waitFor(() => expect(page.text()).toContain('Showing 1 of 1 rows'))

    expect(page.text()).toContain('Revenue')
    expect(page.text()).toContain('Conversion rate')
    const params = lastParams()
    expect(params.granularity).toBe('day')
    expect(params.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(params.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(spanInDays(params)).toBe(29)
  })

  it('changes the range and granularity and refetches', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Showing 1 of 1 rows'))
    const initialCalls = vi.mocked(fetchReports).mock.calls.length

    const selects = page.findAllComponents(Select)
    expect(selects).toHaveLength(2)
    selects[0].vm.$emit('update:modelValue', 'last7')
    await vi.waitFor(() =>
      expect(vi.mocked(fetchReports).mock.calls.length).toBeGreaterThan(initialCalls),
    )
    expect(spanInDays(lastParams())).toBe(6)

    selects[1].vm.$emit('update:modelValue', 'week')
    await vi.waitFor(() => expect(lastParams().granularity).toBe('week'))

    selects[0].vm.$emit('update:modelValue', 'last90')
    await vi.waitFor(() => expect(spanInDays(lastParams())).toBe(89))
  })

  it('shows skeleton rows while the first request is pending', () => {
    vi.mocked(fetchReports).mockReturnValue(new Promise<ReportData>(() => {}))
    const page = mountPage()
    expect(page.findAll('[data-slot="table-row"]').length).toBeGreaterThan(0)
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchReports).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Report unavailable'))

    vi.mocked(fetchReports).mockResolvedValue(makeReport([reportRow(1)]))
    const retry = page.findAll('button').find((button) => button.text().includes('Try again'))
    expect(retry).toBeTruthy()
    await retry!.trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Showing 1 of 1 rows'))
  })

  it('shows the empty state when the range has no rows', async () => {
    vi.mocked(fetchReports).mockResolvedValue(makeReport([]))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('No rows for this range'))
  })

  it('paginates detail rows and clamps the page when the row count shrinks', async () => {
    const many = Array.from({ length: 12 }, (_, index) => reportRow(index))
    vi.mocked(fetchReports).mockResolvedValue(makeReport(many))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 2'))

    await page.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()
    expect(page.text()).toContain('Page 2 of 2')

    // A refetch with fewer rows must pull the pager back without a filter change.
    vi.mocked(fetchReports).mockResolvedValue(makeReport([reportRow(1), reportRow(2)]))
    await queryClient.invalidateQueries({ queryKey: ['reports'] })
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 1'))
  })

  it('draws the trend and channel charts', async () => {
    vi.mocked(fetchReports).mockResolvedValue(chartReport())
    const page = mountPage()

    await vi.waitFor(() => expect(page.find('[data-report-chart="trend"]').exists()).toBe(true))
    expect(page.find('[data-chart-line]').exists()).toBe(true)
    expect(page.find('[data-chart-area]').exists()).toBe(true)
    expect(page.find('[data-chart-reference]').exists()).toBe(true)
    expect(page.findAll('[data-donut-segment]')).toHaveLength(2)
    expect(page.findAll('[data-report-channel]')).toHaveLength(2)
    expect(page.get('[data-report-channel="direct"]').text()).toContain('60%')
  })

  it('drops the target line when the metric switches to orders', async () => {
    vi.mocked(fetchReports).mockResolvedValue(chartReport())
    const page = mountPage()
    await vi.waitFor(() => expect(page.find('[data-chart-reference]').exists()).toBe(true))

    await page.get('[data-radio-option="orders"]').setValue(true)
    await flushPromises()

    expect(page.find('[data-chart-reference]').exists()).toBe(false)
    expect(page.get('[data-radio-option="orders"]').attributes('checked')).toBeDefined()
  })

  it('moves the target from the stepper', async () => {
    vi.mocked(fetchReports).mockResolvedValue(chartReport())
    const page = mountPage()
    await vi.waitFor(() => expect(page.find('[data-input-number]').exists()).toBe(true))

    expect((page.get('[data-input-number]').element as HTMLInputElement).value).toBe('5800')
    await page.get('[data-input-number-step="up"]').trigger('click')
    await flushPromises()

    expect((page.get('[data-input-number]').element as HTMLInputElement).value).toBe('5900')
  })

  it('exports the summary and the detail CSV', async () => {
    vi.mocked(fetchReports).mockResolvedValue(chartReport())
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Showing 1 of 1 rows'))

    // Reka opens the menu from the keyboard in jsdom; the pointer path is
    // covered by the shared dropdown tests.
    await page.get('[data-report-export]').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const items = page.findAllComponents(DropdownMenuItem)
    expect(items).toHaveLength(2)

    items[0]!.vm.$emit('select')
    await flushPromises()
    expect(downloadCsv).toHaveBeenCalledWith(
      'report-2026-01-01-2026-01-30.csv',
      expect.arrayContaining([expect.arrayContaining(['2026-01-01', 3200, 32])]),
    )

    items[1]!.vm.$emit('select')
    await flushPromises()
    expect(downloadCsv).toHaveBeenCalledWith(
      'report-detail-2026-01-01-2026-01-30.csv',
      expect.arrayContaining([expect.arrayContaining(['2026-01-15', 'Direct', 101, 3, 2])]),
    )
  })

  it('shows the empty channel card when the range has no channels', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('No channel breakdown'))
    expect(page.findAll('[data-donut-segment]')).toHaveLength(0)
  })
})
