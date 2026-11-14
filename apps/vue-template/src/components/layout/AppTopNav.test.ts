import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AppTopNav from './AppTopNav.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
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
    const wrapper = mount(AppTopNav, { global: { plugins: [makeRouter()] } })

    expect(wrapper.attributes('data-tour')).toBe('topnav')
    // Overview, Management and Account keep at least one reachable item once the
    // collaboration group is empty in this build, so three triggers show up.
    expect(wrapper.findAll('nav button').map((button) => button.text())).toEqual([
      'Overview',
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
      global: { plugins: [router] },
      attachTo: document.body,
    })

    const trigger = wrapper.findAll('nav button')[1]!
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const link = document.body.querySelector<HTMLAnchorElement>('a[href="/users"]')
    expect(link?.textContent).toContain('Users')
    link?.click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/users'))
    wrapper.unmount()
  })
})
