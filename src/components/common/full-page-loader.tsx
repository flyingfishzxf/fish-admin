import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/common/brand'

export function FullPageLoader({ label }: { label?: string }) {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background">
      <BrandMark className="size-11" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label ?? t('states.loading')}
      </div>
    </div>
  )
}
