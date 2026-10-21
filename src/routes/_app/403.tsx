import { createFileRoute, Link } from '@tanstack/react-router'
import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createFileRoute('/_app/403')({
  component: ForbiddenPage,
})

function ForbiddenPage() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('forbidden.title'))

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-7" />
      </div>
      <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-muted-foreground">403</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('forbidden.title')}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('forbidden.description')}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground/80">{t('forbidden.hint')}</p>
      <Button asChild className="mt-6">
        <Link to="/">{t('forbidden.action')}</Link>
      </Button>
    </div>
  )
}
