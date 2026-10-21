import { createFileRoute, Link } from '@tanstack/react-router'
import { CloudOff, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusScreen } from '@/components/common/status-screen'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/503')({
  component: ServiceUnavailablePage,
})

function ServiceUnavailablePage() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('status.unavailable.title'))

  return (
    <StatusScreen
      code="503"
      icon={CloudOff}
      tone="warning"
      title={t('status.unavailable.title')}
      description={t('status.unavailable.description')}
      hint={t('status.unavailable.hint')}
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="size-4" />
            {t('status.unavailable.action')}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t('goHome')}</Link>
          </Button>
        </>
      }
    />
  )
}
