import type { AuthUser } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface ProfileInput {
  name: string
  /** Omitted when the user cleared the field: the server keeps it empty either way. */
  bio?: string
  /** `null` removes the stored avatar; omit to leave it untouched. */
  avatar?: string | null
}

export function updateProfile(input: ProfileInput) {
  return apiRequest<AuthUser>('/profile', { method: 'PATCH', body: input })
}
