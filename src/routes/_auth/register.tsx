import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { RegisterPage } from '@/features/auth/components/register-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterRoute,
})

function RegisterRoute() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('register.title'))
  return <RegisterPage />
}
