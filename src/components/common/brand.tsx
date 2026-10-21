import { Fish } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-brand shadow-glow flex size-9 shrink-0 items-center justify-center rounded-xl text-white',
        className,
      )}
    >
      <Fish className="size-5" strokeWidth={2.2} />
    </div>
  )
}

export function Brand({
  className,
  showTagline = true,
}: {
  className?: string
  showTagline?: boolean
}) {
  const { t } = useTranslation('common')

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold tracking-tight">{t('app.name')}</p>
        {showTagline ? (
          <p className="truncate text-[11px] text-muted-foreground">{t('app.tagline')}</p>
        ) : null}
      </div>
    </div>
  )
}
