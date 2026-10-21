import {
  CatchBoundary,
  createFileRoute,
  Outlet,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import { AppShell } from '@/components/layout/app-shell'
import { requireSession } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app')({
  beforeLoad: async (context) => {
    requireSession(context)
    await ensureNamespaces('auth')
  },
  component: AppLayout,
})

function AppLayout() {
  const router = useRouter()

  return (
    <AppShell>
      <CatchBoundary
        getResetKey={() => router.state.location.href}
        errorComponent={InShellRouteError}
      >
        <Outlet />
      </CatchBoundary>
    </AppShell>
  )
}

function InShellRouteError({ reset }: ErrorComponentProps) {
  const { t } = useTranslation('errors')

  return (
    <ErrorState
      className="my-6"
      title={t('routeError.title')}
      description={t('routeError.description')}
      onRetry={reset}
    />
  )
}
