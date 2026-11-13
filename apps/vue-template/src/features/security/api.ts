import type { AuthSession } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface TwoFactorSetup {
  secret: string
  /** Fixed demo code the mock accepts; the setup dialog shows it as a hint. */
  demoCode: string
}

export function changePassword(input: ChangePasswordInput) {
  return apiRequest<void>('/auth/change-password', { method: 'POST', body: input })
}

export function fetchSessions(signal?: AbortSignal) {
  return apiRequest<AuthSession[]>('/auth/sessions', { signal })
}

export function revokeSession(id: string) {
  return apiRequest<void>(`/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function revokeOtherSessions() {
  return apiRequest<void>('/auth/sessions', { method: 'DELETE' })
}

export function setupTwoFactor() {
  return apiRequest<TwoFactorSetup>('/auth/2fa/setup', { method: 'POST' })
}

export function enableTwoFactor(code: string) {
  return apiRequest<{ twoFactorEnabled: boolean }>('/auth/2fa/enable', {
    method: 'POST',
    body: { code },
  })
}

export function disableTwoFactor(password: string) {
  return apiRequest<{ twoFactorEnabled: boolean }>('/auth/2fa/disable', {
    method: 'POST',
    body: { password },
  })
}
