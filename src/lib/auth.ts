import { redirect } from '@tanstack/react-router'

import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth-store'

interface GuardContext {
  location: { href: string }
}

function loginRedirect(context: GuardContext) {
  return redirect({
    to: '/login',
    search: { redirect: context.location.href },
    replace: true,
  })
}

export function requireSession(context: GuardContext) {
  const { status, user } = useAuthStore.getState()
  if (status !== 'authenticated' || !user) throw loginRedirect(context)
}

export function requirePermission(permission: string) {
  return (context: GuardContext) => {
    const { status, user } = useAuthStore.getState()
    if (status !== 'authenticated' || !user) throw loginRedirect(context)
    if (!hasPermission(user.permissions, permission)) {
      throw redirect({ to: '/403', replace: true })
    }
  }
}

export function sanitizeRedirect(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return undefined
  if (value.startsWith('/login')) return undefined
  return value
}
