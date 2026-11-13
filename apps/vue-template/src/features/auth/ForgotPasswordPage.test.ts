import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { forgotPasswordRequest } from './api'
import ForgotPasswordPage from './ForgotPasswordPage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  forgotPasswordRequest: vi.fn(),
}))

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordPage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/register', name: 'register', component: { template: '<div>register</div>' } },
      { path: '/reset-password', name: 'reset-password', component: { template: '<div>r</div>' } },
    ],
  })
  await router.push('/forgot-password')
  await router.isReady()
  return mount(ForgotPasswordPage, { global: { plugins: [router] } })
}

describe('ForgotPasswordPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(forgotPasswordRequest).mockReset()
  })

  it('rejects an invalid address before calling the API', async () => {
    const wrapper = await mountPage()

    await wrapper.get('#forgot-email').setValue('nope')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(forgotPasswordRequest).not.toHaveBeenCalled()
  })

  it('offers the demo reset link when the mock returns a token', async () => {
    vi.mocked(forgotPasswordRequest).mockResolvedValue({ demoResetToken: 'reset-1' })
    const wrapper = await mountPage()

    await wrapper.get('#forgot-email').setValue('admin@fish.dev')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(forgotPasswordRequest).toHaveBeenCalledWith('admin@fish.dev')
    expect(wrapper.text()).toContain('Check your inbox')
    expect(wrapper.text()).toContain('Demo reset link')
    expect(wrapper.find('[data-action="open-demo-link"]').exists()).toBe(true)
  })

  it('explains that no demo account matches when no token comes back', async () => {
    vi.mocked(forgotPasswordRequest).mockResolvedValue({})
    const wrapper = await mountPage()

    await wrapper.get('#forgot-email').setValue('stranger@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('No demo account matches this email')
    expect(wrapper.find('[data-action="open-demo-link"]').exists()).toBe(false)
  })
})
