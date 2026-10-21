import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { OtpPage } from '@/features/auth/components/otp-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/otp')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { challenge?: string; email?: string; redirect?: string } => ({
    challenge: typeof search.challenge === 'string' ? search.challenge : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: OtpRoute,
})

function OtpRoute() {
  const { challenge, email, redirect } = Route.useSearch()
  const { t } = useTranslation('auth')
  useDocumentTitle(t('otp.title'))
  return <OtpPage challenge={challenge} email={email} redirect={redirect} />
}
