import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import CommandPalette from './CommandPalette.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/notifications', component: Stub },
      { path: '/profile', component: Stub },
      { path: '/login', component: Stub },
    ],
  })
}

let wrapper: VueWrapper | null = null

async function openPalette() {
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

  const router = makeRouter()
  await router.push('/')
  await router.isReady()
  wrapper = mount(CommandPalette, { global: { plugins: [router] }, attachTo: document.body })
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  useUiStore().setCommandOpen(true)
  await flushPromises()
  return router
}

function itemIds() {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-command-item]')).map(
    (node) => node.dataset.commandItem,
  )
}

async function type(value: string) {
  const input = document.body.querySelector<HTMLInputElement>('[data-command-palette] input')
  if (!input) throw new Error('command input missing')
  input.value = value
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

describe('CommandPalette', () => {
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

  it('lists every reachable page plus the action group', async () => {
    await openPalette()

    // Sidebar order first: Dashboard, the keyless inbox, the reachable
    // management page, then the three unpermissioned account pages, then the
    // action group.
    expect(itemIds()).toEqual([
      'nav:/',
      'nav:/notifications',
      'nav:/users',
      'nav:/profile',
      'nav:/security',
      'nav:/settings',
      'action:theme',
      'action:language',
      'action:profile',
      'action:signOut',
    ])
    expect(document.body.textContent).toContain('Navigation')
    expect(document.body.textContent).toContain('Actions')
  })

  it('filters by label and path', async () => {
    await openPalette()

    await type('users')
    expect(itemIds()).toEqual(['nav:/users'])

    await type('sign')
    expect(itemIds()).toEqual(['action:signOut'])

    await type('zzz')
    expect(itemIds()).toEqual([])
    expect(document.body.textContent).toContain('No results found.')
  })

  it('closes before running the selected command', async () => {
    const router = await openPalette()

    const target = document.body.querySelector<HTMLButtonElement>(
      '[data-command-item="nav:/users"]',
    )
    target?.click()
    await flushPromises()

    expect(useUiStore().commandOpen).toBe(false)
    expect(router.currentRoute.value.path).toBe('/users')
  })

  it('moves the selection with the arrow keys and runs it on Enter', async () => {
    const router = await openPalette()
    const dialog = document.body.querySelector<HTMLElement>('[data-command-palette]')

    // One press moves off the first row, which is the inbox.
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()
    expect(
      document.body
        .querySelector('[data-command-item="nav:/notifications"]')
        ?.getAttribute('aria-selected'),
    ).toBe('true')

    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/notifications')
  })
})
