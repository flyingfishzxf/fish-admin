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
import { enforceMenuAccess } from '@/features/navigation/menu-access'
import { requireSession } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app')({
  beforeLoad: async (context) => {
    requireSession(context)
    // The menu decides what is reachable, so the shell waits for it — bounded by
    // the guard's own timeout so a missing `GET /menu` cannot lock anyone out.
    await Promise.all([enforceMenuAccess(context), ensureNamespaces('auth')])
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
