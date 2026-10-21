import type { ErrorComponentProps } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'

export function RouteError({ reset }: ErrorComponentProps) {
  const { t } = useTranslation('errors')

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <ErrorState
        className="w-full max-w-lg"
        title={t('routeError.title')}
        description={t('routeError.description')}
        onRetry={reset}
      />
    </div>
  )
}
