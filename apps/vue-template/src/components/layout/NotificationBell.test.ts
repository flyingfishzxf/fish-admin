import type { WorkspaceNotification } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import {
  fetchNotifications,
  markAllNotificationsRead,
  updateNotification,
} from '../../features/notifications/api'
import NotificationBell from './NotificationBell.vue'

vi.mock('../../features/notifications/api', () => ({
  fetchNotifications: vi.fn(),
  updateNotification: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

const mockedFetch = vi.mocked(fetchNotifications)
const mockedUpdate = vi.mocked(updateNotification)
const mockedMarkAll = vi.mocked(markAllNotificationsRead)

function makeItems(count: number, read = false): WorkspaceNotification[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `n${index + 1}`,
    userId: 'u1',
    kind: 'mention',
    actorName: 'Grace Hopper',
    entityType: 'project',
    entityLabel: 'Apollo',
    read,
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  }))
}

let wrapper: VueWrapper | null = null
let router: Router

async function mountBell(unreadCount: number, items = makeItems(2)) {
  mockedFetch.mockResolvedValue({
    items,
    total: items.length,
    page: 1,
    pageSize: 5,
    pageCount: 1,
    unreadCount,
  })
  setActivePinia(createPinia())
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/notifications', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  wrapper = mount(NotificationBell, {
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
    attachTo: document.body,
  })
  await flushPromises()
}

async function openPanel() {
  const trigger = wrapper?.get('[data-tour="notifications"]')
  await trigger?.trigger('click')
  await flushPromises()
}

describe('NotificationBell', () => {
  beforeEach(async () => {
    await i18nReady
    localStorage.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('truncates the badge above nine and names the unread count', async () => {
    await mountBell(12)

    expect(wrapper?.get('[data-slot="notification-badge"]').text()).toBe('9+')
    expect(wrapper?.get('[data-tour="notifications"]').attributes('aria-label')).toContain('12')
  })

  it('hides the badge and disables mark-all when nothing is unread', async () => {
    await mountBell(0, makeItems(2, true))
    await openPanel()

    expect(wrapper?.find('[data-slot="notification-badge"]').exists()).toBe(false)
    const markAll = document.body.querySelector<HTMLButtonElement>('[data-bell-action="mark-all"]')
    expect(markAll?.disabled).toBe(true)
  })

  it('lists the five most recent notifications', async () => {
    await mountBell(2, makeItems(5))
    await openPanel()

    const items = document.body.querySelectorAll('[data-bell-item]')
    expect(items).toHaveLength(5)
    expect(items[0]?.textContent).toContain('Grace Hopper')
  })

  it('marks an unread item read before opening its deep link', async () => {
    mockedUpdate.mockResolvedValue(makeItems(1)[0]!)
    await mountBell(2, makeItems(2))
    await openPanel()

    document.body.querySelector<HTMLButtonElement>('[data-bell-item]')?.click()
    await flushPromises()

    expect(mockedUpdate).toHaveBeenCalledWith('n1', true)
    expect(router.currentRoute.value.path).toBe('/notifications')
    expect(router.currentRoute.value.query.notification).toBe('n1')
  })

  it('marks every notification read from the panel', async () => {
    mockedMarkAll.mockResolvedValue({ updated: 4 })
    await mountBell(4, makeItems(2))
    await openPanel()

    document.body.querySelector<HTMLButtonElement>('[data-bell-action="mark-all"]')?.click()
    await flushPromises()

    expect(mockedMarkAll).toHaveBeenCalledTimes(1)
  })
})
