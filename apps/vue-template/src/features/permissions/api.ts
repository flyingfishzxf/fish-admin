import type { PermissionDefinition } from '@fish-admin/contracts/permissions'

import { apiRequest } from '../../lib/api-client'

// `GET /permissions` is authorised by `permission:read` and returns the whole
// registry. The role matrix groups the same list, so the two features share this
// module instead of each declaring its own copy.
export function fetchPermissions(signal?: AbortSignal) {
  return apiRequest<PermissionDefinition[]>('/permissions', { signal })
}
