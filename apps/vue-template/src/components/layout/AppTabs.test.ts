import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { queryClient } from '../../lib/query-client'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import AppTabs from './AppTabs.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/roles', component: Stub },
      { path: '/profile', component: Stub },
      { path: '/403', component: Stub },
    ],
  })
}

let wrapper: VueWrapper | null = null

async function mountTabs(path: string) {
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
  const router: Router = makeRouter()
  await router.push(path)
  await router.isReady()
  wrapper = mount(AppTabs, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return router
}

function tabPaths() {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-tab]')).map(
    (node) => node.dataset.tab,
  )
}

describe('AppTabs', () => {
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

  it('ignores routes that are not in the menu', async () => {
    await mountTabs('/403')
    expect(document.body.querySelector('[data-slot="app-tabs"]')).toBeNull()
  })

  it('opens one tab per visited page, in order', async () => {
    const router = await mountTabs('/')

    await router.push('/users')
    await flushPromises()

    expect(tabPaths()).toEqual(['/', '/users'])
    expect(document.body.querySelector('[data-tab="/users"]')?.getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('falls back to the remaining tab when the active one closes', async () => {
    const router = await mountTabs('/')
    await router.push('/users')
    await flushPromises()

    document.body.querySelector<HTMLElement>('[data-tab-action="close:/users"]')?.click()
    await flushPromises()

    expect(tabPaths()).toEqual(['/'])
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('keeps pinned tabs when closing everything', async () => {
    const router = await mountTabs('/')
    const ui = useUiStore()
    ui.toggleTabPin('/')
    await router.push('/users')
    await flushPromises()

    document.body.querySelector<HTMLElement>('[data-tab-action="close-all"]')?.click()
    await flushPromises()

    expect(tabPaths()).toEqual(['/'])
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('restores the workbench from storage on mount', async () => {
    localStorage.setItem(
      'fish-admin:ui',
      JSON.stringify({
        state: {
          tabs: [
            { to: '/', pinned: true },
            { to: '/roles', pinned: false },
          ],
        },
        version: 1,
      }),
    )
    await mountTabs('/roles')

    expect(tabPaths()).toEqual(['/', '/roles'])
  })

  it('reloads the current page data from the tab menu', async () => {
    await mountTabs('/users')
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    const trigger = document.body.querySelector<HTMLElement>('[data-tab-action="menu:/users"]')
    trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()

    const reload = Array.from(
      document.body.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]'),
    ).find((item) => item.textContent?.includes('Reload'))
    reload?.click()
    await vi.waitFor(() => expect(spy).toHaveBeenCalled())
    spy.mockRestore()
  })
})
