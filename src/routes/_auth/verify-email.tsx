import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { VerifyEmailPage } from '@/features/auth/components/verify-email-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/verify-email')({
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  const { token, email } = Route.useSearch()
  const { t } = useTranslation('auth')
  useDocumentTitle(t('verify.title'))
  return <VerifyEmailPage token={token} email={email} />
}
