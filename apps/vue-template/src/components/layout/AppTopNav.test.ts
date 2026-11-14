import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AppTopNav from './AppTopNav.vue'

vi.mock('../../features/notifications/api', () => ({
  fetchNotifications: vi.fn(() =>
    Promise.resolve({ items: [], total: 0, page: 1, pageSize: 5, pageCount: 0, unreadCount: 0 }),
  ),
  updateNotification: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}))

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/notifications', component: Stub },
    ],
  })
}

function seedAdmin() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['dashboard:read', 'user:read'],
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'
}

function testQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('AppTopNav', () => {
  beforeEach(async () => {
    await i18nReady
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders one menu per reachable group and the shared header actions', async () => {
    seedAdmin()
    const wrapper = mount(AppTopNav, {
      global: { plugins: [makeRouter(), [VueQueryPlugin, { queryClient: testQueryClient() }]] },
    })

    expect(wrapper.attributes('data-tour')).toBe('topnav')
    // All four groups keep at least one reachable item: Collaboration is down to
    // the keyless inbox, which every role can open.
    expect(wrapper.findAll('nav button').map((button) => button.text())).toEqual([
      'Overview',
      'Collaboration',
      'Management',
      'Account',
    ])
    expect(wrapper.get('a[href="/"]').attributes('aria-label')).toBe('FishAdmin')
  })

  it('opens a group and navigates to the chosen page', async () => {
    seedAdmin()
    const router = makeRouter()
    await router.push('/')
    await router.isReady()
    const wrapper = mount(AppTopNav, {
      global: { plugins: [router, [VueQueryPlugin, { queryClient: testQueryClient() }]] },
      attachTo: document.body,
    })

    // Collaboration sits at index 1 now, so Management is the third trigger.
    const trigger = wrapper.findAll('nav button')[2]!
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const link = document.body.querySelector<HTMLAnchorElement>('a[href="/users"]')
    expect(link?.textContent).toContain('Users')
    link?.click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/users'))
    wrapper.unmount()
  })
})
