import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { loginRequest, meRequest } from '../auth/api'
import LoginPage from './LoginPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  loginRequest: vi.fn(),
  meRequest: vi.fn(),
}))

function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/users', component: { template: '<div>users</div>' } },
      { path: '/', component: { template: '<div>home</div>' } },
    ],
  })
  return { router, wrapper: mount(LoginPage, { global: { plugins: [router] } }) }
}

describe('LoginPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
  })

  it('validates required fields and email format', async () => {
    const { wrapper } = mountPage()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Email is required.')
    expect(wrapper.text()).toContain('Password is required.')

    await wrapper.get('#login-email').setValue('not-an-email')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(loginRequest).not.toHaveBeenCalled()
  })

  it('fills the form from a demo account', async () => {
    const { wrapper } = mountPage()
    await wrapper.get('button[data-demo="admin"]').trigger('click')
    expect((wrapper.get('#login-email').element as HTMLInputElement).value).toBe('admin@fish.dev')
    expect((wrapper.get('#login-password').element as HTMLInputElement).value).toBe('Admin123!')
  })

  it('shows the mapped server error', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'))
    const { wrapper } = mountPage()
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('Incorrect email or password.')
  })

  it('disables the submit button while signing in', async () => {
    vi.mocked(loginRequest).mockReturnValue(new Promise(() => {}))
    const { wrapper } = mountPage()
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').text()).toContain('Signing in')
  })

  it('returns to the sanitized redirect after login', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue({
      id: 'u1',
      name: 'Ada',
      email: 'ada@fish.dev',
      roleId: 'r1',
      roleName: 'Admin',
      permissions: ['*'],
      emailVerified: true,
      twoFactorEnabled: false,
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginPage },
        { path: '/otp', name: 'otp', component: { template: '<div>otp</div>' } },
        { path: '/users', component: { template: '<div>users</div>' } },
        { path: '/', component: { template: '<div>home</div>' } },
      ],
    })
    await router.push('/login?redirect=/users')
    await router.isReady()
    const wrapper = mount(LoginPage, { global: { plugins: [router] } })
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/users')
  })

  // The mock answers MFA-capable accounts with HTTP 200 plus an MFA payload, so
  // the page must hand the challenge to /otp instead of signing in.
  it('forwards an MFA challenge to the OTP page', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      mfaRequired: true,
      challengeId: 'challenge-1',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: LoginPage },
        { path: '/otp', name: 'otp', component: { template: '<div>otp</div>' } },
        { path: '/users', component: { template: '<div>users</div>' } },
        { path: '/', component: { template: '<div>home</div>' } },
      ],
    })
    await router.push('/login?redirect=/users')
    await router.isReady()
    const wrapper = mount(LoginPage, { global: { plugins: [router] } })
    await wrapper.get('#login-email').setValue('ada@fish.dev')
    await wrapper.get('#login-password').setValue('secret123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(loginRequest).toHaveBeenCalledWith('ada@fish.dev', 'secret123')
    expect(meRequest).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/otp')
    expect(router.currentRoute.value.query).toEqual({
      challenge: 'challenge-1',
      email: 'ada@fish.dev',
      redirect: '/users',
    })
  })
})
