import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { resetPasswordRequest } from './api'
import ResetPasswordPage from './ResetPasswordPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  resetPasswordRequest: vi.fn(),
}))

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/reset-password', name: 'reset-password', component: ResetPasswordPage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      {
        path: '/forgot-password',
        name: 'forgot-password',
        component: { template: '<div>forgot</div>' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mount(ResetPasswordPage, { global: { plugins: [router] } })
}

describe('ResetPasswordPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(resetPasswordRequest).mockReset()
  })

  it('asks for a token when the link has none', async () => {
    const wrapper = await mountAt('/reset-password')

    expect(wrapper.text()).toContain('Reset link missing')
    expect(wrapper.text()).toContain('Request a new password reset link to continue.')
    expect(resetPasswordRequest).not.toHaveBeenCalled()
  })

  it('reports a mismatched confirmation', async () => {
    const wrapper = await mountAt('/reset-password?token=t1&email=admin@fish.dev')

    await wrapper.get('#reset-password').setValue('Password1')
    await wrapper.get('#reset-confirm').setValue('Password2')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Passwords do not match.')
    expect(resetPasswordRequest).not.toHaveBeenCalled()
  })

  it('resets the password and points back at sign-in', async () => {
    vi.mocked(resetPasswordRequest).mockResolvedValue(undefined)
    const wrapper = await mountAt('/reset-password?token=t1&email=admin@fish.dev')

    await wrapper.get('#reset-password').setValue('Password1')
    await wrapper.get('#reset-confirm').setValue('Password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(resetPasswordRequest).toHaveBeenCalledWith({ token: 't1', password: 'Password1' })
    expect(wrapper.text()).toContain('Password updated')
    expect(wrapper.find('[data-action="go-to-login"]').exists()).toBe(true)
  })

  it('explains an expired token', async () => {
    vi.mocked(resetPasswordRequest).mockRejectedValue(new ApiError(400, 'INVALID_TOKEN', 'bad'))
    const wrapper = await mountAt('/reset-password?token=t1')

    await wrapper.get('#reset-password').setValue('Password1')
    await wrapper.get('#reset-confirm').setValue('Password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'This reset link is invalid or has expired.',
    )
  })
})
