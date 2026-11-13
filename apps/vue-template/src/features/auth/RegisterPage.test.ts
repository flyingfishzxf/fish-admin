import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { registerRequest } from './api'
import RegisterPage from './RegisterPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  registerRequest: vi.fn(),
}))

function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', name: 'register', component: RegisterPage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      {
        path: '/verify-email',
        name: 'verify-email',
        component: { template: '<div>verify</div>' },
      },
    ],
  })
  return { router, wrapper: mount(RegisterPage, { global: { plugins: [router] } }) }
}

describe('RegisterPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(registerRequest).mockReset()
  })

  it('rejects a short name, a weak password and a mismatch', async () => {
    const { wrapper } = mountPage()

    await wrapper.get('#register-name').setValue('A')
    await wrapper.get('#register-email').setValue('new@fish.dev')
    await wrapper.get('#register-password').setValue('short')
    await wrapper.get('#register-confirm').setValue('different')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Full name must be at least 2 characters.')
    expect(wrapper.text()).toContain('Password must be at least 8 characters.')
    expect(registerRequest).not.toHaveBeenCalled()
  })

  it('requires a letter and a number in the password', async () => {
    const { wrapper } = mountPage()

    await wrapper.get('#register-name').setValue('Ada Lovelace')
    await wrapper.get('#register-email').setValue('new@fish.dev')
    await wrapper.get('#register-password').setValue('12345678')
    await wrapper.get('#register-confirm').setValue('12345678')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Include at least one letter.')
    expect(registerRequest).not.toHaveBeenCalled()
  })

  it('shows the demo token and links to the verification page', async () => {
    vi.mocked(registerRequest).mockResolvedValue({
      email: 'new@fish.dev',
      verificationToken: 'token-123',
    })
    const { wrapper } = mountPage()

    await wrapper.get('#register-name').setValue('Ada Lovelace')
    await wrapper.get('#register-email').setValue('new@fish.dev')
    await wrapper.get('#register-password').setValue('Password1')
    await wrapper.get('#register-confirm').setValue('Password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(registerRequest).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'new@fish.dev',
      password: 'Password1',
    })
    expect(wrapper.text()).toContain('Check your inbox')
    expect(wrapper.text()).toContain('new@fish.dev')
    expect(wrapper.text()).toContain('Demo mode exposes the verification token')

    const verifyLink = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Verify email now'))
    expect(verifyLink).toBeTruthy()
  })

  it('maps a taken email to its own message', async () => {
    vi.mocked(registerRequest).mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', 'taken'))
    const { wrapper } = mountPage()

    await wrapper.get('#register-name').setValue('Ada Lovelace')
    await wrapper.get('#register-email').setValue('admin@fish.dev')
    await wrapper.get('#register-password').setValue('Password1')
    await wrapper.get('#register-confirm').setValue('Password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'An account with this email already exists.',
    )
  })
})
