import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button, cn } from '@fish-admin/react'

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  const { t } = useTranslation('common')

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title ?? t('states.error.title')}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {description ?? t('states.error.description')}
        </p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-4" />
          {t('actions.retry')}
        </Button>
      ) : null}
    </div>
  )
}
