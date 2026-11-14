import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import AppSidebar from './AppSidebar.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/users', component: Stub },
      { path: '/notifications', component: Stub },
      { path: '/profile', component: Stub },
      { path: '/security', component: Stub },
      { path: '/settings', component: Stub },
    ],
  })
}

function seedUser(permissions: string[]) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions,
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'
}

function groupKeys(wrapper: VueWrapper) {
  return wrapper
    .findAll('[data-sidebar-group]')
    .map((node) => node.attributes('data-sidebar-group'))
}

describe('AppSidebar', () => {
  beforeEach(async () => {
    await i18nReady
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('filters items by permission and marks the active route', async () => {
    seedUser(['dashboard:read', 'user:read'])
    const router = makeRouter()
    await router.push('/users')

    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })

    const links = wrapper.findAll('nav a[data-sidebar-link]')
    // The three account pages carry no permission key, so they survive a
    // viewer's narrow permission set — this is UX, not a security boundary.
    expect(links.map((link) => link.text())).toEqual([
      'Dashboard',
      'Notifications',
      'Users',
      'Profile',
      'Security',
      'Settings',
    ])
    expect(wrapper.get('a[aria-current="page"]').attributes('href')).toBe('/users')
    expect(groupKeys(wrapper)).toEqual([
      'nav:groups.overview',
      'nav:groups.collaboration',
      'nav:groups.management',
      'nav:groups.account',
    ])
  })

  it('hides users without user:read', () => {
    seedUser(['dashboard:read'])
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).not.toContain('Users')
  })

  it('drops a group whose every item is denied', () => {
    seedUser(['dashboard:read'])
    const wrapper = mount(AppSidebar, { global: { plugins: [makeRouter()] } })

    // `Management` ships only Users in this build, so denying user:read must
    // remove the heading too — never leave a bare group title behind.
    // Collaboration survives on the keyless inbox alone, which is exactly the
    // case this test now proves the filter handles.
    expect(groupKeys(wrapper)).toEqual([
      'nav:groups.overview',
      'nav:groups.collaboration',
      'nav:groups.account',
    ])
    expect(wrapper.text()).toContain('Notifications')
    expect(wrapper.text()).not.toContain('Management')
  })

  it('closes the mobile drawer with Escape and restores focus', async () => {
    seedUser(['dashboard:read'])
    const router = makeRouter()
    await router.push('/')
    const trigger = document.createElement('button')
    trigger.id = 'sidebar-trigger'
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(AppSidebar, { global: { plugins: [router] } })
    const ui = useUiStore()
    ui.openMobile()
    await flushPromises()

    const drawer = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(drawer).toBeTruthy()
    expect(document.activeElement?.getAttribute('data-sidebar-link')).not.toBeNull()

    drawer?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(ui.mobileOpen).toBe(false)
    expect(document.activeElement).toBe(trigger)
    wrapper.unmount()
  })
})
