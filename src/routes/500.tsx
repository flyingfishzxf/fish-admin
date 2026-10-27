import { createFileRoute, Link } from '@tanstack/react-router'
import { RotateCw, ServerCrash } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { StatusScreen } from '@/components/common/status-screen'
import { Button } from '@fish-admin/react'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/500')({
  component: ServerErrorPage,
})

function ServerErrorPage() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('status.serverError.title'))

  return (
    <StatusScreen
      code="500"
      icon={ServerCrash}
      tone="destructive"
      title={t('status.serverError.title')}
      description={t('status.serverError.description')}
      hint={t('status.serverError.hint')}
      actions={
        <>
          <Button onClick={() => window.location.reload()}>
            <RotateCw className="size-4" />
            {t('status.serverError.action')}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t('goHome')}</Link>
          </Button>
        </>
      }
    />
  )
}
