import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { meRequest, verifyMfaRequest } from './api'
import OtpPage from './OtpPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  verifyMfaRequest: vi.fn(),
  meRequest: vi.fn(),
}))

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/otp', name: 'otp', component: OtpPage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/users', name: 'users', component: { template: '<div>users</div>' } },
      { path: '/', name: 'dashboard', component: { template: '<div>home</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return { router, wrapper: mount(OtpPage, { global: { plugins: [router] } }) }
}

async function fillCode(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'], code: string) {
  const slots = wrapper.findAll('input[data-slot="otp-slot"]')
  for (const [index, char] of Array.from(code).entries()) {
    await slots[index]!.setValue(char)
  }
  await flushPromises()
}

describe('OtpPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(verifyMfaRequest).mockReset()
    vi.mocked(meRequest).mockReset()
  })

  it('asks to start from sign-in when the challenge is missing', async () => {
    const { wrapper } = await mountAt('/otp')

    expect(wrapper.text()).toContain('Verification challenge missing')
    expect(verifyMfaRequest).not.toHaveBeenCalled()
  })

  it('shows the fixed demo code for the tester', async () => {
    const { wrapper } = await mountAt('/otp?challenge=c1&email=ada@fish.dev')
    expect(wrapper.text()).toContain('246810')
  })

  it('rejects a wrong code and clears the field', async () => {
    vi.mocked(verifyMfaRequest).mockRejectedValue(new ApiError(401, 'INVALID_CODE', 'wrong'))
    const { wrapper } = await mountAt('/otp?challenge=c1&email=ada@fish.dev')

    await fillCode(wrapper, '111111')

    expect(verifyMfaRequest).toHaveBeenCalledWith('c1', '111111')
    await vi.waitFor(() => expect(wrapper.get('[role="alert"]').text()).not.toBe(''))
    expect(wrapper.text()).toContain('The verification code is incorrect.')
  })

  it('signs in and honours the redirect target', async () => {
    vi.mocked(verifyMfaRequest).mockResolvedValue({ accessToken: 'a', refreshToken: 'r' })
    vi.mocked(meRequest).mockResolvedValue({
      id: 'user-admin',
      name: 'Avery',
      email: 'ada@fish.dev',
      roleId: 'admin',
      roleName: 'Administrator',
      permissions: ['*'],
      emailVerified: true,
      twoFactorEnabled: true,
    })
    const { router, wrapper } = await mountAt(
      '/otp?challenge=c1&email=ada@fish.dev&redirect=/users',
    )

    await fillCode(wrapper, '246810')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/users'))
  })
})
