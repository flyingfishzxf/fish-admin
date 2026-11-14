import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import AppSubnav from './AppSubnav.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/roles', component: Stub },
      { path: '/settings', component: Stub },
      { path: '/profile', component: Stub },
      { path: '/security', component: Stub },
      { path: '/403', component: Stub },
    ],
  })
}

let wrapper: VueWrapper | null = null

async function mountSubnav(path: string) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['dashboard:read', 'user:read', 'role:read'],
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  wrapper = mount(AppSubnav, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
}

function items() {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-subnav-item]')).map(
    (node) => node.dataset.subnavItem,
  )
}

describe('AppSubnav', () => {
  beforeEach(async () => {
    await i18nReady
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('lists the group of the current page and marks it', async () => {
    await mountSubnav('/users')

    expect(items()).toEqual(['/users', '/roles'])
    expect(
      document.body.querySelector('[data-subnav-item="/users"]')?.getAttribute('aria-current'),
    ).toBe('page')
    expect(
      document.body.querySelector('[data-slot="app-subnav"]')?.getAttribute('aria-label'),
    ).toBe('Management')
  })

  it('follows the active group across pages', async () => {
    await mountSubnav('/settings')
    expect(items()).toEqual(['/profile', '/security', '/settings'])
  })

  it('renders nothing outside the menu', async () => {
    await mountSubnav('/403')
    expect(document.body.querySelector('[data-slot="app-subnav"]')).toBeNull()
  })
})
