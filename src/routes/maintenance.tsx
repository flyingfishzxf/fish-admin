import { createFileRoute, Link } from '@tanstack/react-router'
import { RotateCw, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusScreen } from '@/components/common/status-screen'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/maintenance')({
  component: MaintenancePage,
})

function MaintenancePage() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('status.maintenance.title'))

  return (
    <StatusScreen
      code="503"
      icon={Wrench}
      tone="muted"
      title={t('status.maintenance.title')}
      description={t('status.maintenance.description')}
      hint={t('status.maintenance.hint')}
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="size-4" />
            {t('status.maintenance.action')}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t('goHome')}</Link>
          </Button>
        </>
      }
    />
  )
}
