import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/auth-store'

export function useCan(permission?: string) {
  const permissions = useAuthStore((state) => state.user?.permissions)
  return hasPermission(permissions, permission)
}
