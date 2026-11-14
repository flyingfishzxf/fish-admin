import type { AuditEvent, PaginatedResult } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchUserActivity } from './api'
import UserActivityTab from './UserActivityTab.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, fetchUserActivity: vi.fn() }
})

function event(id: string, extra: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id,
    action: 'user.updated',
    actorId: 'u-admin',
    actorName: 'Ada Lovelace',
    entityType: 'user',
    entityId: 'u1',
    entityLabel: 'Grace Hopper',
    metadata: {},
    createdAt: '2026-11-01T10:00:00.000Z',
    ...extra,
  }
}

function pageOf(items: AuditEvent[]): PaginatedResult<AuditEvent> {
  return { items, total: items.length, page: 1, pageSize: 20, pageCount: 1 }
}

let wrapper: VueWrapper | null = null

function mountTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(UserActivityTab, {
    props: { userId: 'u1' },
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

describe('UserActivityTab', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('asks for the newest twenty events of this user', async () => {
    vi.mocked(fetchUserActivity).mockResolvedValue(pageOf([]))
    mountTab()
    await flushPromises()

    expect(fetchUserActivity).toHaveBeenCalledWith('u1', 20, expect.anything())
    expect(wrapper!.text()).toContain('No activity recorded for this user yet.')
  })

  it('renders a tone-coloured row per event with a short metadata byline', async () => {
    vi.mocked(fetchUserActivity).mockResolvedValue(
      pageOf([
        event('e1', {
          metadata: { actorId: 'u-admin', email: 'grace@fish.dev', role: 'Manager' },
        }),
        event('e2', {
          action: 'user.deleted',
          actorName: '',
          entityType: 'role',
          metadata: {},
        }),
      ]),
    )
    const page = mountTab()
    await vi.waitFor(() => expect(page.findAll('[data-slot="timeline-item"]')).toHaveLength(2))

    expect(page.text()).toContain('Updated user')
    expect(page.text()).toContain('Ada Lovelace · email: grace@fish.dev · role: Manager')
    expect(page.text()).toContain('Deleted user')
    // An empty actor name falls back to "System".
    expect(page.text()).toContain('System')
    expect(page.findAll('[data-slot="timeline-bubble"]')[0]?.find('svg').exists()).toBe(true)
  })

  it('shows a retryable error instead of a timeline', async () => {
    vi.mocked(fetchUserActivity).mockRejectedValue(new Error('offline'))
    const page = mountTab()
    await vi.waitFor(() => expect(page.text()).toContain('Could not load audit events.'))

    expect(page.find('[data-slot="timeline"]').exists()).toBe(false)
  })

  it('keeps a skeleton while the request is in flight', async () => {
    vi.mocked(fetchUserActivity).mockImplementation(() => new Promise(() => {}))
    const page = mountTab()
    await flushPromises()

    expect(page.find('[data-slot="activity-skeleton"]').exists()).toBe(true)
  })
})
