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
