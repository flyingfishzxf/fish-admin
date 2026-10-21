import type { AuthUser, ProfileInput } from '@/types'
import { apiRequest } from '@/lib/api-client'

export function updateProfile(input: ProfileInput) {
  return apiRequest<AuthUser>('/profile', { method: 'PATCH', body: input })
}
