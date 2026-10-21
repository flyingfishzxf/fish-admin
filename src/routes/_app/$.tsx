import { createFileRoute, Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_app/$')({
  component: InShellNotFound,
})

function InShellNotFound() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('notFound.title'))

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Compass className="size-7" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('notFound.description')}</p>
      <Button asChild className="mt-6">
        <Link to="/">{t('notFound.action')}</Link>
      </Button>
    </div>
  )
}
