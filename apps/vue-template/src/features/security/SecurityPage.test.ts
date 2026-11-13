import type { AuthSession, AuthUser } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { meRequest } from '../auth/api'
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  fetchSessions,
  revokeOtherSessions,
  revokeSession,
  setupTwoFactor,
} from './api'
import SecurityPage from './SecurityPage.vue'

vi.mock('../auth/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/api')>()),
  meRequest: vi.fn(),
}))

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  changePassword: vi.fn(),
  fetchSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
  setupTwoFactor: vi.fn(),
  enableTwoFactor: vi.fn(),
  disableTwoFactor: vi.fn(),
}))

function authUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'u-admin',
    name: 'Ada Admin',
    email: 'admin@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['*'],
    emailVerified: true,
    twoFactorEnabled: false,
    ...overrides,
  }
}

function session(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    id: 's1',
    browser: 'Chrome',
    os: 'Windows',
    ip: '127.0.0.1',
    createdAt: '2026-11-01T10:00:00.000Z',
    lastActiveAt: '2026-11-13T10:00:00.000Z',
    expiresAt: '2026-12-01T10:00:00.000Z',
    current: true,
    ...overrides,
  }
}

const currentSession = session()
const otherSession = session({ id: 's2', browser: 'Safari', os: 'macOS', current: false })

let wrapper: VueWrapper | null = null
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
  wrapper = mount(SecurityPage, {
    // Attached so the dialogs teleport into a real body element.
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function inBody<T extends Element>(selector: string) {
  const element = document.body.querySelector<T>(selector)
  expect(element).toBeTruthy()
  return element as T
}

function clickInBody(selector: string) {
  inBody<HTMLButtonElement>(selector).dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

async function fillOtp(code: string) {
  const slots = Array.from(
    document.body.querySelectorAll<HTMLInputElement>('input[data-slot="otp-slot"]'),
  )
  expect(slots).toHaveLength(6)
  for (const [index, char] of Array.from(code).entries()) {
    slots[index]!.value = char
    slots[index]!.dispatchEvent(new Event('input', { bubbles: true }))
  }
  await flushPromises()
}

describe('SecurityPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    vi.resetAllMocks()
    vi.mocked(fetchSessions).mockResolvedValue([currentSession])
    wrapper = null
  })

  afterEach(() => {
    wrapper?.unmount()
    document.body.innerHTML = ''
  })

  it('validates the password form before calling the API', async () => {
    const page = mountPage()
    await flushPromises()

    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.text()).toContain('Current password is required.')

    await page.get('#current-password').setValue('Admin123!')
    await page.get('#new-password').setValue('short')
    await page.get('#confirm-password').setValue('short')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.text()).toContain('New password must be at least 8 characters.')

    await page.get('#new-password').setValue('abcd1234')
    await page.get('#confirm-password').setValue('abcd12345')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.text()).toContain('Passwords do not match.')

    expect(changePassword).not.toHaveBeenCalled()
  })

  it('maps a rejected current password to the matching field', async () => {
    vi.mocked(changePassword).mockRejectedValue(
      new ApiError(400, 'INVALID_PASSWORD', 'The current password is incorrect.'),
    )
    const page = mountPage()
    await flushPromises()

    await page.get('#current-password').setValue('wrong-pass1')
    await page.get('#new-password').setValue('abcd1234')
    await page.get('#confirm-password').setValue('abcd1234')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.text()).toContain('The current password is incorrect.')
  })

  it('maps an unchanged password to the new-password field', async () => {
    vi.mocked(changePassword).mockRejectedValue(
      new ApiError(400, 'PASSWORD_UNCHANGED', 'Choose another password.'),
    )
    const page = mountPage()
    await flushPromises()

    await page.get('#current-password').setValue('Admin123!')
    await page.get('#new-password').setValue('Admin123!')
    await page.get('#confirm-password').setValue('Admin123!')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.text()).toContain('Choose a password you have not used here.')
  })

  it('clears the password form and reports success', async () => {
    vi.mocked(changePassword).mockResolvedValue(undefined)
    const page = mountPage()
    await flushPromises()

    await page.get('#current-password').setValue('Admin123!')
    await page.get('#new-password').setValue('abcd1234')
    await page.get('#confirm-password').setValue('abcd1234')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'Admin123!',
      newPassword: 'abcd1234',
    })
    expect((page.get('#current-password').element as HTMLInputElement).value).toBe('')
    expect(page.get('[data-slot="status"]').text()).toContain('Password updated.')
  })

  it('shows a skeleton while the sessions load', async () => {
    vi.mocked(fetchSessions).mockReturnValue(new Promise(() => {}))
    const page = mountPage()
    await flushPromises()

    expect(page.find('[data-slot="sessions-loading"]').exists()).toBe(true)
  })

  it('shows the load error with a retry action', async () => {
    vi.mocked(fetchSessions).mockRejectedValue(new ApiError(500, 'BOOM', 'boom'))
    const page = mountPage()
    await flushPromises()

    expect(page.text()).toContain('Could not load your sessions.')
    expect(page.find('[data-slot="sessions-loading"]').exists()).toBe(false)
  })

  it('reports an empty session list', async () => {
    vi.mocked(fetchSessions).mockResolvedValue([])
    const page = mountPage()
    await flushPromises()

    expect(page.text()).toContain('No active sessions.')
  })

  it('never offers to revoke the current session and disables revoking the only one', async () => {
    const page = mountPage()
    await flushPromises()

    expect(page.find('[data-action="revoke-session"]').exists()).toBe(false)
    expect(page.get('[data-action="revoke-others"]').attributes('disabled')).toBeDefined()
  })

  it('revokes another session after the confirmation dialog', async () => {
    vi.mocked(fetchSessions).mockResolvedValue([currentSession, otherSession])
    vi.mocked(revokeSession).mockResolvedValue(undefined)
    const page = mountPage()
    await flushPromises()

    expect(page.findAll('[data-action="revoke-session"]')).toHaveLength(1)
    await page.get('[data-action="revoke-session"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Sign out this session?')

    clickInBody('[data-action="confirm"]')
    await flushPromises()

    expect(revokeSession).toHaveBeenCalledWith('s2')
    expect(document.body.textContent).not.toContain('Sign out this session?')
  })

  it('signs out every other session in one action', async () => {
    vi.mocked(fetchSessions).mockResolvedValue([currentSession, otherSession])
    vi.mocked(revokeOtherSessions).mockResolvedValue(undefined)
    const page = mountPage()
    await flushPromises()

    await page.get('[data-action="revoke-others"]').trigger('click')
    await flushPromises()
    clickInBody('[data-action="confirm"]')
    await flushPromises()

    expect(revokeOtherSessions).toHaveBeenCalledTimes(1)
  })

  it('requires a full six-digit code before enabling two-factor authentication', async () => {
    vi.mocked(setupTwoFactor).mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', demoCode: '123456' })
    vi.mocked(enableTwoFactor).mockResolvedValue({ twoFactorEnabled: true })
    vi.mocked(meRequest).mockResolvedValue(authUser({ twoFactorEnabled: true }))
    const page = mountPage()
    await flushPromises()

    expect(page.get('[data-slot="totp-state"]').text()).toBe('Disabled')
    await page.get('[data-action="enable-2fa"]').trigger('click')
    await flushPromises()

    expect(inBody<HTMLInputElement>('#totp-secret').value).toBe('JBSWY3DPEHPK3PXP')
    expect(document.body.textContent).toContain('246810')
    expect(inBody<HTMLButtonElement>('[data-action="confirm-2fa"]').disabled).toBe(true)

    await fillOtp('12345')
    expect(inBody<HTMLButtonElement>('[data-action="confirm-2fa"]').disabled).toBe(true)

    await fillOtp('123456')
    expect(inBody<HTMLButtonElement>('[data-action="confirm-2fa"]').disabled).toBe(false)

    clickInBody('[data-action="confirm-2fa"]')
    await flushPromises()

    expect(enableTwoFactor).toHaveBeenCalledWith('123456')
    expect(meRequest).toHaveBeenCalledWith('token')
    expect(useAuthStore().user?.twoFactorEnabled).toBe(true)
  })

  it('keeps the setup dialog open when the code is rejected', async () => {
    vi.mocked(setupTwoFactor).mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', demoCode: '123456' })
    vi.mocked(enableTwoFactor).mockRejectedValue(
      new ApiError(400, 'INVALID_CODE', 'The verification code is incorrect.'),
    )
    const page = mountPage()
    await flushPromises()

    await page.get('[data-action="enable-2fa"]').trigger('click')
    await flushPromises()
    await fillOtp('000000')
    clickInBody('[data-action="confirm-2fa"]')
    await flushPromises()

    expect(document.body.textContent).toContain('The verification code is incorrect.')
    expect(meRequest).not.toHaveBeenCalled()
  })

  it('requires the password before disabling two-factor authentication', async () => {
    vi.mocked(disableTwoFactor).mockResolvedValue({ twoFactorEnabled: false })
    vi.mocked(meRequest).mockResolvedValue(authUser({ twoFactorEnabled: false }))
    const page = mountPage(authUser({ twoFactorEnabled: true }))
    await flushPromises()

    expect(page.get('[data-slot="totp-state"]').text()).toBe('Enabled')
    await page.get('[data-action="disable-2fa"]').trigger('click')
    await flushPromises()

    expect(inBody<HTMLButtonElement>('[data-action="confirm-disable"]').disabled).toBe(true)

    const input = inBody<HTMLInputElement>('#disable-password')
    input.value = 'Admin123!'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    clickInBody('[data-action="confirm-disable"]')
    await flushPromises()

    expect(disableTwoFactor).toHaveBeenCalledWith('Admin123!')
    expect(useAuthStore().user?.twoFactorEnabled).toBe(false)
  })
})
