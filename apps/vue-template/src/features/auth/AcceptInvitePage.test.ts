import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { acceptInviteRequest, getInviteRequest, meRequest } from './api'
import AcceptInvitePage from './AcceptInvitePage.vue'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  getInviteRequest: vi.fn(),
  acceptInviteRequest: vi.fn(),
  meRequest: vi.fn(),
}))

const PREVIEW = {
  email: 'jamie.rivera@fish.dev',
  name: 'Jamie Rivera',
  roleName: 'Manager',
  invitedByName: 'Avery Chen',
  expiresAt: '2026-11-18T00:00:00.000Z',
}

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/accept-invite', name: 'accept-invite', component: AcceptInvitePage },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      { path: '/', name: 'dashboard', component: { template: '<div>home</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(AcceptInvitePage, {
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient() }]],
    },
  })
  await flushPromises()
  return { router, wrapper }
}

describe('AcceptInvitePage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    setActivePinia(createPinia())
    vi.mocked(getInviteRequest).mockReset()
    vi.mocked(acceptInviteRequest).mockReset()
    vi.mocked(meRequest).mockReset()
  })

  it('requires a token', async () => {
    const { wrapper } = await mountAt('/accept-invite')

    expect(wrapper.text()).toContain('Invitation missing')
    expect(getInviteRequest).not.toHaveBeenCalled()
  })

  it('explains an expired invitation', async () => {
    vi.mocked(getInviteRequest).mockRejectedValue(new ApiError(410, 'INVITE_EXPIRED', 'gone'))
    const { wrapper } = await mountAt('/accept-invite?token=fish-demo-invite')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Invitation unavailable'))
    expect(wrapper.text()).toContain('This invitation has expired.')
  })

  it('prefills the invited name and locks the email', async () => {
    vi.mocked(getInviteRequest).mockResolvedValue(PREVIEW)
    const { wrapper } = await mountAt('/accept-invite?token=fish-demo-invite')

    await vi.waitFor(() => expect(wrapper.find('#invite-name').exists()).toBe(true))
    expect(wrapper.text()).toContain('jamie.rivera@fish.dev')
    expect(wrapper.text()).toContain('Invited by Avery Chen')
    expect(wrapper.text()).toContain('Manager')
    expect((wrapper.get('#invite-name').element as HTMLInputElement).value).toBe('Jamie Rivera')
    expect(wrapper.get('#invite-email').attributes('disabled')).toBeDefined()
  })

  it('accepts the invitation, signs in and lands on the dashboard', async () => {
    vi.mocked(getInviteRequest).mockResolvedValue(PREVIEW)
    vi.mocked(acceptInviteRequest).mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    })
    vi.mocked(meRequest).mockResolvedValue({
      id: 'user-jamie',
      name: 'Jamie Rivera',
      email: PREVIEW.email,
      roleId: 'manager',
      roleName: 'Manager',
      permissions: ['dashboard:read'],
      emailVerified: true,
      twoFactorEnabled: false,
    })
    const { router, wrapper } = await mountAt('/accept-invite?token=fish-demo-invite')

    await vi.waitFor(() => expect(wrapper.find('#invite-password').exists()).toBe(true))
    await wrapper.get('#invite-password').setValue('Password1')
    await wrapper.get('#invite-confirm').setValue('Password1')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(acceptInviteRequest).toHaveBeenCalledWith({
      token: 'fish-demo-invite',
      name: 'Jamie Rivera',
      email: 'jamie.rivera@fish.dev',
      password: 'Password1',
    })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
  })
})
