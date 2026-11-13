import type { AuthUser } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

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

export function loginRequest(email: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
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
  return apiRequest<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
}
export function meRequest(accessToken: string) {
  return apiRequest<AuthUser>('/auth/me', { token: accessToken, auth: false })
}

export interface RegisterInput {
  name: string
  email: string
  password: string
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

export function resetPasswordRequest(input: { token: string; password: string }) {
  return apiRequest<void>('/auth/reset-password', {
    method: 'POST',
    body: input,
    auth: false,
  })
}

export interface InvitePreview {
  email: string
  name?: string
  roleName: string
  invitedByName: string
  expiresAt: string
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
