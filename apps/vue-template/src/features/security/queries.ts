import type { AuthSession } from '@fish-admin/contracts'
import { queryOptions } from '@tanstack/vue-query'

import { authKeys } from '../auth/queries'
import { fetchSessions } from './api'

// Shares `['auth', 'sessions']` with the auth store so signing in, changing the
// password or toggling 2FA invalidates one cache entry, not three.
export function sessionsQueryOptions() {
  return queryOptions<AuthSession[]>({
    queryKey: authKeys.sessions(),
    queryFn: ({ signal }) => fetchSessions(signal),
  })
}
