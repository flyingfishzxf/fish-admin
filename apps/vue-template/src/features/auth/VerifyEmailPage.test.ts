import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { verifyEmailRequest } from './api'
import VerifyEmailPage from './VerifyEmailPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  verifyEmailRequest: vi.fn(),
}))

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/verify-email', name: 'verify-email', component: VerifyEmailPage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/register', name: 'register', component: { template: '<div>register</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mount(VerifyEmailPage, { global: { plugins: [router] } })
}

describe('VerifyEmailPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(verifyEmailRequest).mockReset()
  })

  it('asks for a link when the token is missing', async () => {
    const wrapper = await mountAt('/verify-email')

    expect(wrapper.text()).toContain('Verification link missing')
    expect(wrapper.text()).toContain('This page needs a valid token.')
    expect(verifyEmailRequest).not.toHaveBeenCalled()
  })

  it('waits for a click before verifying, then reports the address', async () => {
    vi.mocked(verifyEmailRequest).mockResolvedValue({ email: 'new@fish.dev' })
    const wrapper = await mountAt('/verify-email?token=abc&email=new@fish.dev')

    expect(verifyEmailRequest).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('new@fish.dev')

    await wrapper.get('[data-action="verify-email"]').trigger('click')
    await flushPromises()

    expect(verifyEmailRequest).toHaveBeenCalledWith('abc')
    expect(wrapper.text()).toContain('Email verified')
    expect(wrapper.text()).toContain('new@fish.dev is now verified. You can sign in.')
  })

  it('explains an expired link', async () => {
    vi.mocked(verifyEmailRequest).mockRejectedValue(new ApiError(400, 'INVALID_TOKEN', 'bad'))
    const wrapper = await mountAt('/verify-email?token=abc&email=new@fish.dev')

    await wrapper.get('[data-action="verify-email"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'This verification link is invalid or has expired.',
    )
  })
})
