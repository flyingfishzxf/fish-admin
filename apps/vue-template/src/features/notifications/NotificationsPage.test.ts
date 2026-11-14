import type { PaginatedResult, WorkspaceNotification } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import {
  fetchNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  updateNotification,
  type NotificationListResult,
} from './api'
import NotificationsPage from './NotificationsPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchNotifications: vi.fn(),
    fetchNotification: vi.fn(),
    updateNotification: vi.fn(),
    markNotificationsRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  }
})

const Stub = { template: '<div />' }

function notification(
  id: string,
  extra: Partial<WorkspaceNotification> = {},
): WorkspaceNotification {
  return {
    id,
    userId: 'u1',
    kind: 'mention',
    actorId: 'u2',
    actorName: 'Ada Lovelace',
    entityType: 'project',
    entityId: 'p1',
    entityLabel: 'Atlas',
    read: false,
    createdAt: '2026-11-13T09:00:00.000Z',
    ...extra,
  }
}

const mention = notification('n1')
const invite = notification('n2', {
  kind: 'invite',
  entityType: 'file',
  entityId: 'f1',
  entityLabel: 'Q4 plan.xlsx',
  read: true,
})

function listOf(
  items: WorkspaceNotification[],
  overrides: Partial<NotificationListResult> = {},
): NotificationListResult {
  const base: PaginatedResult<WorkspaceNotification> = {
    items,
    total: items.length,
    page: 1,
    pageSize: 10,
    pageCount: 1,
  }
  return { ...base, unreadCount: items.filter((item) => !item.read).length, ...overrides }
}

let wrapper: VueWrapper | null = null
let queryClient: QueryClient
let router: Router

async function mountPage(path = '/notifications') {
  const pinia = createPinia()
  setActivePinia(pinia)
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/notifications', name: 'notifications', component: NotificationsPage },
      { path: '/integrations', name: 'integrations', component: Stub },
      { path: '/users', name: 'users', component: Stub },
    ],
  })
  await router.push(path)
  await router.isReady()

  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(NotificationsPage, {
    // Attached so the detail drawer can hand focus back to its trigger.
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  return wrapper
}

function query() {
  return router.currentRoute.value.query
}

describe('NotificationsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchNotifications).mockResolvedValue(listOf([mention, invite]))
    vi.mocked(fetchNotification).mockResolvedValue(mention)
    vi.mocked(updateNotification).mockResolvedValue({ ...mention, read: true })
    vi.mocked(markNotificationsRead).mockResolvedValue({ updated: 2 })
    vi.mocked(markAllNotificationsRead).mockResolvedValue({ updated: 2 })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders the rows and the unread count reported by the server', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.findAll('[data-notification-row]')).toHaveLength(2))
    // The badge is the server's count, not a client-side tally of this page:
    // unread items on other pages would otherwise be invisible in the header.
    expect(page.get('[data-header-unread]').text()).toBe('1')
    expect(page.text()).toContain('Ada Lovelace mentioned you in Atlas')
    expect(page.findAll('[data-unread-dot]')).toHaveLength(1)
  })

  it('writes the filter to the URL and drops the page', async () => {
    const page = await mountPage('/notifications?page=2')

    await page.get('[data-segmented-option="unread"]').trigger('click')
    await vi.waitFor(() => expect(query().filter).toBe('unread'))
    // Page 2 of the unfiltered inbox has nothing to do with page 2 of the unread
    // one, so the switch has to start over at the first page.
    expect(query().page).toBeUndefined()
  })

  it('marks a single row through PATCH', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.findAll('[data-notification-row]')).toHaveLength(2))
    await page.findAll('[data-row-action="toggle-read"]')[0]!.trigger('click')

    await vi.waitFor(() => expect(updateNotification).toHaveBeenCalledWith('n1', true))
    expect(markNotificationsRead).not.toHaveBeenCalled()
  })

  it('selects every row and marks the selection read in one request', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.findAll('[data-notification-row]')).toHaveLength(2))
    expect(page.find('[data-page-action="mark-selected"]').exists()).toBe(false)

    await page.get('[aria-label="Select all notifications on this page"]').trigger('click')
    await flushPromises()

    const button = page.get('[data-page-action="mark-selected"]')
    expect(button.text()).toContain('2')
    await button.trigger('click')

    await vi.waitFor(() =>
      expect(markNotificationsRead).toHaveBeenCalledWith([mention.id, invite.id]),
    )
  })

  it('uses the caught-up copy for an empty unread filter and the generic copy otherwise', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue(listOf([]))

    const unread = await mountPage('/notifications?filter=unread')
    await vi.waitFor(() => expect(unread.text()).toContain("You're all caught up."))

    unread.unmount()
    wrapper = null
    document.body.innerHTML = ''

    const all = await mountPage()
    await vi.waitFor(() => expect(all.text()).toContain('No notifications'))
  })

  it('opens the drawer from a deep link without touching the row state', async () => {
    const page = await mountPage('/notifications?notification=n1')

    await vi.waitFor(() => expect(document.body.querySelector('[data-drawer-body]')).not.toBeNull())
    expect(document.body.textContent).toContain('Ada Lovelace mentioned you in Atlas')
    // Arriving by URL is a read of the inbox, not a click: the React template
    // also leaves the flag alone here, and the bell marks it before navigating.
    expect(updateNotification).not.toHaveBeenCalled()
    expect(page.findAll('[data-notification-row]')).toHaveLength(2)
  })

  it('marks an opened unread row read and writes the deep link', async () => {
    const page = await mountPage()

    await vi.waitFor(() => expect(page.findAll('[data-notification-row]')).toHaveLength(2))
    await page.findAll('[data-notification-open]')[0]!.trigger('click')

    await vi.waitFor(() => expect(updateNotification).toHaveBeenCalledWith('n1', true))
    // `router.replace` settles a tick after the mutation is fired, so the URL
    // assertion has to wait for the navigation, not just for the request.
    await vi.waitFor(() => expect(query().notification).toBe('n1'))
  })

  it('clears only the notification parameter when the drawer closes', async () => {
    // Three pages, so page 2 is in range and survives the close instead of being
    // clamped away the moment the list loads.
    vi.mocked(fetchNotifications).mockResolvedValue(
      listOf([mention, invite], { pageCount: 3, page: 2 }),
    )
    const page = await mountPage('/notifications?page=2&filter=unread&notification=n1')

    await vi.waitFor(() => expect(document.body.querySelector('[data-drawer-body]')).not.toBeNull())
    const close = document.body.querySelector<HTMLButtonElement>(
      '[data-slot="dialog-content"] [data-slot="dialog-close"]',
    )
    expect(close).not.toBeNull()
    close!.click()

    await vi.waitFor(() => expect(query().notification).toBeUndefined())
    expect(query().page).toBe('2')
    expect(query().filter).toBe('unread')
    expect(page.findAll('[data-notification-row]')).toHaveLength(2)
  })
})
