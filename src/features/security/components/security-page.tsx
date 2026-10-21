import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/common/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDocumentTitle } from '@/lib/document-title'

import { ChangePasswordCard } from './change-password-card'
import { SessionsCard } from './sessions-card'
import { TwoFactorCard } from './two-factor-card'

export function SecurityPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('security:title'))

  return (
    <div className="space-y-6">
      <PageHeader title={t('security:title')} description={t('security:subtitle')} />

      <Alert>
        <ShieldAlert />
        <AlertTitle>{t('security:demo.title')}</AlertTitle>
        <AlertDescription>{t('security:demo.description')}</AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ChangePasswordCard />
          <SessionsCard />
        </div>
        <div className="space-y-6">
          <TwoFactorCard />
        </div>
      </div>
    </div>
  )
}
