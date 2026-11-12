import type { ReportData } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchReports } from './api'
import ReportsPage from './ReportsPage.vue'

vi.mock('./api', () => ({ fetchReports: vi.fn() }))

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

function makeReport(rows: ReportData['rows'] = []): ReportData {
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
  }
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
})
