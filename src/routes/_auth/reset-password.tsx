import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ResetPasswordPage } from '@/features/auth/components/reset-password-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/reset-password')({
  validateSearch: (search: Record<string, unknown>): { token?: string; email?: string } => ({
    token: typeof search.token === 'string' ? search.token : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { token, email } = Route.useSearch()
  const { t } = useTranslation('auth')
  useDocumentTitle(t('reset.title'))
  return <ResetPasswordPage token={token} email={email} />
}
