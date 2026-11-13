import type { AuthUser } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { updateProfile } from './api'
import ProfilePage from './ProfilePage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  updateProfile: vi.fn(),
}))

function authUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u-admin',
    name: 'Ada Admin',
    email: 'admin@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['user:read', 'user:create'],
    emailVerified: true,
    twoFactorEnabled: false,
    ...overrides,
  }
}

let wrapper: VueWrapper | null = null
let router: Router
let queryClient: QueryClient

function mountPage(user: AuthUser = authUser()) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = user
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
      { path: '/profile', component: ProfilePage },
      { path: '/login', component: { template: '<div>login</div>' } },
    ],
  })
  wrapper = mount(ProfilePage, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

describe('ProfilePage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    vi.mocked(updateProfile).mockReset()
    wrapper = null
  })

  it('renders the account summary and the effective permissions', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page.get('[data-slot="card-title"]').text()).toBe('Personal information')
    expect(page.text()).toContain('Admin')
    expect(page.text()).toContain('admin@fish.dev')
    expect(page.text()).toContain('u-admin')
    expect(page.get('[data-permissions="list"]').text()).toContain('View users')
    expect(page.get('[data-permissions="list"]').text()).toContain('Create users')
    expect(page.text()).toContain('2 granted')
    expect((page.get('#profile-name').element as HTMLInputElement).value).toBe('Ada Admin')
    expect((page.get('#profile-email').element as HTMLInputElement).readOnly).toBe(true)
  })

  it('collapses a wildcard role to "All permissions"', async () => {
    const page = mountPage(authUser({ permissions: ['*'] }))
    await flushPromises()
    expect(page.get('[data-permissions="all"]').text()).toBe('All permissions')
  })

  it('reports an empty permission set', async () => {
    const page = mountPage(authUser({ permissions: [] }))
    await flushPromises()
    expect(page.get('[data-permissions="empty"]').text()).toBe('No permissions granted.')
  })

  it('rejects a name shorter than two characters', async () => {
    const page = mountPage()
    await page.get('#profile-name').setValue('A')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.get('[data-error="name"]').text()).toBe('Full name must be at least 2 characters.')
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('rejects a bio longer than 280 characters', async () => {
    const page = mountPage()
    await page.get('#profile-bio').setValue('x'.repeat(281))
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.get('[data-error="bio"]').text()).toBe('Bio must be at most 280 characters.')
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it('writes the saved profile back to the store', async () => {
    const page = mountPage(authUser({ bio: undefined }))
    const updated = authUser({ name: 'Ada Lovelace', bio: 'Counting machines' })
    vi.mocked(updateProfile).mockResolvedValue(updated)

    await page.get('#profile-name').setValue('Ada Lovelace')
    await page.get('#profile-bio').setValue('Counting machines')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(updateProfile).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      bio: 'Counting machines',
    })
    const auth = useAuthStore()
    expect(auth.user?.name).toBe('Ada Lovelace')
    expect(page.get('[data-slot="save-status"]').text()).toBe('Profile updated.')
  })

  it('omits an empty bio instead of sending an empty string', async () => {
    const page = mountPage()
    vi.mocked(updateProfile).mockResolvedValue(authUser())

    await page.get('form').trigger('submit')
    await flushPromises()

    expect(updateProfile).toHaveBeenCalledWith({ name: 'Ada Admin', bio: undefined })
  })

  it('rejects an avatar that is not a png, jpeg or webp', async () => {
    const page = mountPage()
    const input = page.get('[data-slot="avatar-file"]')
    const file = new File(['<svg/>'], 'avatar.svg', { type: 'image/svg+xml' })

    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(page.get('[data-error="avatar"]').text()).toBe('Choose a PNG, JPG or WebP image.')
    expect(page.find('[data-action="remove-avatar"]').exists()).toBe(false)
  })

  it('only offers to remove an avatar that exists', async () => {
    const withoutAvatar = mountPage()
    await flushPromises()
    expect(withoutAvatar.find('[data-action="remove-avatar"]').exists()).toBe(false)
    withoutAvatar.unmount()

    const page = mountPage(authUser({ avatar: 'data:image/webp;base64,abc' }))
    await flushPromises()
    expect(page.find('[data-action="remove-avatar"]').exists()).toBe(true)
  })

  it('signs out and returns to the login page', async () => {
    const page = mountPage()
    await router.push('/profile')
    await page.get('[data-action="sign-out"]').trigger('click')
    await flushPromises()

    const auth = useAuthStore()
    expect(auth.status).toBe('anonymous')
    expect(auth.user).toBeNull()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
