import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AcceptInvitePage } from '@/features/auth/components/accept-invite-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/accept-invite')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: AcceptInviteRoute,
})

function AcceptInviteRoute() {
  const { token } = Route.useSearch()
  const { t } = useTranslation('auth')
  useDocumentTitle(t('invite.title'))
  return <AcceptInvitePage token={token} />
}
