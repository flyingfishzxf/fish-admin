import { apiRequest } from '@/lib/api-client'
import type { AuthSession, AuthUser, InvitePreview } from '@/types'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface MfaRequiredResponse {
  mfaRequired: true
  challengeId: string
  expiresAt: string
}

export type LoginResponse = TokenPair | MfaRequiredResponse

export function isMfaRequired(result: LoginResponse): result is MfaRequiredResponse {
  return 'mfaRequired' in result && result.mfaRequired === true
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface ResetPasswordInput {
  token: string
  password: string
}

// Every pre-session endpoint sets `auth: false`: no bearer is attached, and a 401
// must surface as a plain error instead of clearing the session and starting a refresh.
export function loginRequest(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function verifyMfaRequest(challengeId: string, code: string) {
  return apiRequest<TokenPair>('/auth/mfa/verify', {
    method: 'POST',
    body: { challengeId, code },
    auth: false,
  })
}

export function registerRequest(input: RegisterInput) {
  return apiRequest<{ email: string; verificationToken: string }>('/auth/register', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export function verifyEmailRequest(token: string) {
  return apiRequest<{ email: string }>('/auth/verify-email', {
    method: 'POST',
    body: { token },
    auth: false,
  })
}

export function forgotPasswordRequest(email: string) {
  return apiRequest<{ demoResetToken?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}

export function resetPasswordRequest(input: ResetPasswordInput) {
  return apiRequest<void>('/auth/reset-password', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export function getInviteRequest(token: string, signal?: AbortSignal) {
  return apiRequest<InvitePreview>(`/auth/invites/${encodeURIComponent(token)}`, {
    signal,
    auth: false,
  })
}

export function acceptInviteRequest(input: RegisterInput & { token: string }) {
  return apiRequest<TokenPair>('/auth/accept-invite', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export function refreshRequest(refreshToken: string) {
  return apiRequest<TokenPair>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  })
}

export function logoutRequest(refreshToken: string) {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  })
}

export function meRequest(accessToken: string) {
  return apiRequest<AuthUser>('/auth/me', { token: accessToken, auth: false })
}

export function changePasswordRequest(currentPassword: string, newPassword: string) {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}

export function getSessionsRequest(signal?: AbortSignal) {
  return apiRequest<AuthSession[]>('/auth/sessions', { signal })
}

export function revokeSessionRequest(sessionId: string) {
  return apiRequest<void>(`/auth/sessions/${sessionId}`, { method: 'DELETE' })
}

export function revokeOtherSessionsRequest() {
  return apiRequest<void>('/auth/sessions', { method: 'DELETE' })
}

export function setupTwoFactorRequest() {
  return apiRequest<{ secret: string; demoCode: string }>('/auth/2fa/setup', { method: 'POST' })
}

export function enableTwoFactorRequest(code: string) {
  return apiRequest<{ twoFactorEnabled: boolean }>('/auth/2fa/enable', {
    method: 'POST',
    body: { code },
  })
}

export function disableTwoFactorRequest(password: string) {
  return apiRequest<{ twoFactorEnabled: boolean }>('/auth/2fa/disable', {
    method: 'POST',
    body: { password },
  })
}
