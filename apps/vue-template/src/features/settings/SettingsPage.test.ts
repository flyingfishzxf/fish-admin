import type { AuthUser } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { useThemeStore } from '../../stores/theme'
import { useUiStore } from '../../stores/ui'
import { meRequest } from '../auth/api'
import { resetDemoData } from './api'
import SettingsPage from './SettingsPage.vue'

vi.mock('../../config/env', () => ({
  env: { apiBaseUrl: '/api', enableMock: true, mockLatency: 0, requestTimeout: 15_000 },
}))

vi.mock('../auth/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/api')>()),
  meRequest: vi.fn(),
}))

vi.mock('./api', () => ({ resetDemoData: vi.fn() }))

let wrapper: VueWrapper | null = null
let router: Router
let queryClient: QueryClient

function mountPage(user: Partial<AuthUser> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u-admin',
    name: 'Ada Admin',
    email: 'admin@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['*'],
    emailVerified: true,
    twoFactorEnabled: false,
    ...user,
  }
  auth.status = 'authenticated'
  auth.accessToken = 'token'
  auth.refreshToken = 'refresh'

  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>home</div>' } },
      { path: '/settings', component: SettingsPage },
      { path: '/security', component: { template: '<div>security</div>' } },
      { path: '/401', component: { template: '<div>401</div>' } },
      { path: '/500', component: { template: '<div>500</div>' } },
      { path: '/503', component: { template: '<div>503</div>' } },
      { path: '/maintenance', component: { template: '<div>maintenance</div>' } },
    ],
  })
  wrapper = mount(SettingsPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

describe('SettingsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    vi.clearAllMocks()
    localStorage.clear()
    wrapper = null
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-accent')
  })

  it('switches the theme mode and persists it', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page.get('[data-mode="system"]').attributes('aria-pressed')).toBe('true')
    await page.get('[data-mode="dark"]').trigger('click')

    const theme = useThemeStore()
    expect(theme.mode).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(page.get('[data-mode="dark"]').attributes('aria-pressed')).toBe('true')
    expect(JSON.parse(localStorage.getItem('fish-admin:theme') ?? '{}').state.mode).toBe('dark')
  })

  it('writes the chosen accent to the document', async () => {
    const page = mountPage()
    await flushPromises()

    await page.get('[data-accent-option="emerald"]').trigger('click')

    expect(useThemeStore().accent).toBe('emerald')
    expect(document.documentElement.dataset.accent).toBe('emerald')
    expect(page.get('[data-accent-option="emerald"]').attributes('aria-pressed')).toBe('true')
  })

  it('renders the shell card with its eight options', async () => {
    const page = mountPage()
    await flushPromises()

    const options = page.findAll('[data-shell-option]')
    expect(options).toHaveLength(8)
    // The defaults come from the store, so the current layout must be pressed.
    expect(page.get('[data-shell-option="layout-sidebar"]').attributes('aria-pressed')).toBe('true')
    expect(page.get('[data-shell-option="density-default"]').attributes('aria-pressed')).toBe(
      'true',
    )
    expect(page.get('[data-shell-option="width-contained"]').attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('stores the shell layout, density and content width', async () => {
    const page = mountPage()
    await flushPromises()

    await page.get('[data-shell-option="layout-header"]').trigger('click')
    await page.get('[data-shell-option="density-compact"]').trigger('click')
    await page.get('[data-shell-option="width-wide"]').trigger('click')

    const ui = useUiStore()
    expect(ui.layout).toBe('header')
    expect(ui.density).toBe('compact')
    expect(ui.contentWidth).toBe('wide')
    expect(JSON.parse(localStorage.getItem('fish-admin:ui') ?? '{}').state).toEqual({
      layout: 'header',
      density: 'compact',
      contentWidth: 'wide',
      tabs: [],
    })
    expect(page.get('[data-shell-option="layout-header"]').attributes('aria-pressed')).toBe('true')
  })

  it('changes the interface language from the select', async () => {
    const page = mountPage()
    await flushPromises()

    // Reka's trigger opens on pointerdown, so driving the bound value is the
    // reliable path in jsdom (the shared Select tests cover the popup).
    page.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', 'zh-CN')

    // The switch goes through the i18n backend, so wait for the document to
    // follow instead of assuming a single flush is enough.
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('zh-CN'))
    expect(localStorage.getItem('fish-admin:lang')).toBe('zh-CN')
    await setLanguage('en')
  })

  it('links to the account security page', async () => {
    const page = mountPage()
    await flushPromises()

    const link = page.get('[data-action="open-security"]')
    expect(link.attributes('href')).toBe('/security')
  })

  it('renders the About card with the Vue stack and the repository links', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page.text()).toContain('Built with Vue 3, Vue Router and Pinia.')
    expect(page.text()).not.toContain('React')
    expect(page.get('[data-link="repository"]').attributes('href')).toBe(
      'https://github.com/flyingfishzxf/fish-admin',
    )
    expect(page.get('[data-link="docs"]').attributes('href')).toContain('docs/en/vue-template.md')
  })

  it('previews the four status pages', async () => {
    const page = mountPage()
    await flushPromises()

    const links = page.findAll('[data-status-page]').map((item) => item.attributes('href'))
    expect(links).toEqual(['/401', '/500', '/503', '/maintenance'])
    expect(page.text()).toContain('Your session has expired')
    expect(page.text()).toContain("We'll be back shortly")
  })

  it('expands the retention panel on demand', async () => {
    const page = mountPage()
    await flushPromises()

    const trigger = page.get('[data-slot="collapsible"] button')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(page.text()).toContain('90 days')
  })

  it('hides the demo card from a role without the reset permission', async () => {
    const page = mountPage({ permissions: ['user:read'] })
    await flushPromises()

    expect(page.find('[data-action="reset-demo"]').exists()).toBe(false)
  })

  it('resets the demo data after the confirmation dialog', async () => {
    vi.mocked(resetDemoData).mockResolvedValue({ ok: true })
    vi.mocked(meRequest).mockResolvedValue({
      id: 'u-admin',
      name: 'Ada Admin',
      email: 'admin@fish.dev',
      roleId: 'r1',
      roleName: 'Admin',
      permissions: ['*'],
      emailVerified: true,
      twoFactorEnabled: false,
    })
    const page = mountPage()
    await flushPromises()

    await page.get('[data-action="reset-demo"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Reset demo data?')

    const confirm = document.body.querySelector<HTMLButtonElement>('[data-action="confirm"]')
    expect(confirm).toBeTruthy()
    confirm!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(resetDemoData).toHaveBeenCalledTimes(1)
    expect(meRequest).toHaveBeenCalledWith('token')
    expect(page.get('[data-slot="status"]').text()).toBe('Demo data has been reset.')
  })
})
