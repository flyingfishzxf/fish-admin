import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import AppShell from './AppShell.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/profile', component: Stub },
      { path: '/security', component: Stub },
      { path: '/settings', component: Stub },
    ],
  })
}

async function mountShell() {
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
  const wrapper = mount(AppShell, {
    global: { plugins: [router] },
    slots: { default: '<p>page body</p>' },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

let wrapper: VueWrapper | null = null

describe('AppShell', () => {
  beforeEach(async () => {
    await i18nReady
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
    delete document.documentElement.dataset.density
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the sidebar layout by default', async () => {
    wrapper = await mountShell()

    expect(wrapper.find('[data-tour="sidebar"]').exists()).toBe(true)
    expect(wrapper.find('#sidebar-trigger').exists()).toBe(true)
    expect(wrapper.find('[data-tour="topnav"]').exists()).toBe(false)
    expect(document.documentElement.dataset.density).toBe('default')
    expect(wrapper.get('main').classes()).toContain('max-w-7xl')
  })

  it('drops the sidebar for the header layout', async () => {
    useUiStore().setLayout('header')
    wrapper = await mountShell()

    expect(wrapper.find('[data-tour="sidebar"]').exists()).toBe(false)
    expect(wrapper.find('[data-tour="topnav"]').exists()).toBe(true)
    expect(wrapper.find('#sidebar-trigger').exists()).toBe(false)
  })

  it('starts the mixed layout on the icon rail', async () => {
    useUiStore().setLayout('mixed')
    wrapper = await mountShell()

    expect(wrapper.get('[data-tour="sidebar"]').attributes('data-collapsed')).toBe('true')
  })

  it('writes the density and content width to the document', async () => {
    wrapper = await mountShell()
    const ui = useUiStore()

    ui.setDensity('compact')
    ui.setContentWidth('full')
    await flushPromises()

    expect(document.documentElement.dataset.density).toBe('compact')
    expect(wrapper.get('main').classes()).toContain('max-w-none')
  })

  it('collapses the rail with Ctrl+B, except in the header layout', async () => {
    wrapper = await mountShell()
    const ui = useUiStore()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }))
    expect(ui.collapsed).toBe(true)

    ui.setCollapsed(false)
    ui.setLayout('header')
    await flushPromises()
    ui.setCollapsed(false)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true }))
    expect(ui.collapsed).toBe(false)
  })
})
