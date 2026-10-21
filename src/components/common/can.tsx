import type { ReactNode } from 'react'

import { useCan } from '@/hooks/use-can'

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission?: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const allowed = useCan(permission)
  return allowed ? <>{children}</> : <>{fallback}</>
}
