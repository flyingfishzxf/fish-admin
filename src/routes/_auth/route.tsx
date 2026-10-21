import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { ensureNamespaces } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    await ensureNamespaces(['auth', 'validation'])
    if (useAuthStore.getState().status === 'authenticated') {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return <Outlet />
}
