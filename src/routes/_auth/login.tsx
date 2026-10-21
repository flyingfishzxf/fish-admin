import { createFileRoute } from '@tanstack/react-router'

import { LoginPage } from '@/features/auth/components/login-page'
import { useDocumentTitle } from '@/lib/document-title'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; email?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect, email } = Route.useSearch()
  const { t } = useTranslation('auth')
  useDocumentTitle(t('title'))

  return <LoginPage redirect={redirect} email={email} />
}
