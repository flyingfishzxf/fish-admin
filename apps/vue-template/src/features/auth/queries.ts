import type { AuthUser } from '@fish-admin/contracts'
import { queryOptions } from '@tanstack/vue-query'

import { getInviteRequest, meRequest, type InvitePreview } from './api'

export const authKeys = {
  all: ['auth'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
  invite: (token: string) => [...authKeys.all, 'invite', token] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

export function inviteQueryOptions(token: string | undefined) {
  return queryOptions<InvitePreview>({
    queryKey: authKeys.invite(token ?? ''),
    queryFn: ({ signal }) => getInviteRequest(token as string, signal),
    enabled: Boolean(token),
    // An expired or used invite must not be retried; the state is permanent.
    retry: false,
  })
}

export function meQueryOptions(accessToken: string) {
  return queryOptions<AuthUser>({
    queryKey: authKeys.me(),
    queryFn: () => meRequest(accessToken),
    staleTime: 60_000,
  })
}
