import { env } from '@/config/env'
import { ApiError } from '@/lib/api-error'
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

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      code?: string
      message?: string
    } | null
    throw new ApiError(
      response.status,
      payload?.code ?? 'REQUEST_FAILED',
      payload?.message ?? response.statusText,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function loginRequest(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function verifyMfaRequest(challengeId: string, code: string) {
  return request<TokenPair>('/auth/mfa/verify', {
    method: 'POST',
    body: { challengeId, code },
  })
}

export function registerRequest(input: RegisterInput) {
  return request<{ email: string; verificationToken: string }>('/auth/register', {
    method: 'POST',
    body: input,
  })
}

export function verifyEmailRequest(token: string) {
  return request<{ email: string }>('/auth/verify-email', {
    method: 'POST',
    body: { token },
  })
}

export function forgotPasswordRequest(email: string) {
  return request<{ demoResetToken?: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPasswordRequest(input: ResetPasswordInput) {
  await request<void>('/auth/reset-password', {
    method: 'POST',
    body: input,
  })
}

export function getInviteRequest(token: string) {
  return request<InvitePreview>(`/auth/invites/${encodeURIComponent(token)}`)
}

export function acceptInviteRequest(input: RegisterInput & { token: string }) {
  return request<TokenPair>('/auth/accept-invite', {
    method: 'POST',
    body: input,
  })
}

export function refreshRequest(refreshToken: string) {
  return request<TokenPair>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  })
}

export async function logoutRequest(refreshToken: string) {
  await request<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
  })
}

export function meRequest(accessToken: string) {
  return request<AuthUser>('/auth/me', { token: accessToken })
}

export function changePasswordRequest(currentPassword: string, newPassword: string) {
  return apiRequest<void>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
}

export function getSessionsRequest() {
  return apiRequest<AuthSession[]>('/auth/sessions')
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
