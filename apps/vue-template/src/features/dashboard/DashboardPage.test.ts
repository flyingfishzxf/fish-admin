import type { DashboardData } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchDashboard } from './api'
import DashboardPage from './DashboardPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, fetchDashboard: vi.fn() }
})

function dashboard(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    range: 7,
    kpis: [
      { id: 'revenue', value: 48200, change: 12.4 },
      { id: 'activeUsers', value: 1284, change: -3.1 },
      { id: 'signups', value: 96, change: 8 },
      { id: 'conversion', value: 3.4, change: 0.6 },
    ],
    revenue: [
      { date: '2026-11-01', value: 5200 },
      { date: '2026-11-02', value: 6100 },
      { date: '2026-11-03', value: 4800 },
    ],
    traffic: [
      { date: '2026-11-01', visits: 320, signups: 41 },
      { date: '2026-11-02', visits: 410, signups: 55 },
      { date: '2026-11-03', visits: 280, signups: 32 },
    ],
    channels: [
      { name: 'direct', value: 42 },
      { name: 'organic', value: 28 },
      { name: 'referral', value: 18 },
      { name: 'social', value: 8 },
      { name: 'email', value: 4 },
    ],
    activity: [
      {
        id: 'a1',
        action: 'user.created',
        actorName: 'Ada Lovelace',
        target: 'Grace Hopper',
        createdAt: '2026-11-13T09:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

async function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  wrapper = mount(DashboardPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  return wrapper
}

describe('DashboardPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    vi.mocked(fetchDashboard).mockResolvedValue(dashboard())
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('renders the four cards in the React grid order', async () => {
    const page = await mountPage()

    const cards = page
      .findAll('[data-dashboard-card]')
      .map((card) => card.attributes('data-dashboard-card'))
    expect(cards).toEqual(['revenue', 'channels', 'traffic', 'activity'])
  })

  it('draws one chart per card', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.find('[data-chart-line]').exists()).toBe(true))
    expect(page.find('[data-chart-area]').exists()).toBe(true)
    expect(page.findAll('[data-chart-bars] rect').length).toBeGreaterThan(0)
    expect(page.findAll('[data-donut-segment]')).toHaveLength(5)
  })

  it('keeps the channel legend in step with the ring', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.findAll('[data-channel]')).toHaveLength(5))
    const legend = page.findAll('[data-channel]').map((item) => item.text())
    expect(legend[0]).toContain('Direct')
    expect(legend[0]).toContain('42%')
  })

  it('refetches when the range changes', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(fetchDashboard).toHaveBeenCalledWith(7, expect.anything()))

    vi.mocked(fetchDashboard).mockResolvedValue(dashboard({ range: 30 }))
    await page.get('[data-range="30"]').trigger('click')

    await vi.waitFor(() => expect(fetchDashboard).toHaveBeenCalledWith(30, expect.anything()))
  })

  it('renders an empty chart instead of breaking when the series is empty', async () => {
    vi.mocked(fetchDashboard).mockResolvedValue(
      dashboard({ revenue: [], traffic: [], channels: [], activity: [] }),
    )
    const page = await mountPage()

    await vi.waitFor(() => expect(page.find('[data-dashboard-card="revenue"]').exists()).toBe(true))
    expect(page.find('[data-chart-line]').exists()).toBe(false)
    expect(page.findAll('[data-donut-segment]')).toHaveLength(0)
    expect(page.find('[data-chart-empty-ring]').exists()).toBe(true)
  })
})
