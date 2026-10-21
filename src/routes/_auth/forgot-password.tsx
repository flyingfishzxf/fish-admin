import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ForgotPasswordPage } from '@/features/auth/components/forgot-password-page'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordRoute,
})

function ForgotPasswordRoute() {
  const { t } = useTranslation('auth')
  useDocumentTitle(t('forgot.title'))
  return <ForgotPasswordPage />
}
