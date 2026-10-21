import { createFileRoute } from '@tanstack/react-router'

import { PermissionsPage } from '@/features/permissions/components/permissions-page'
import { PERMISSION_CODES } from '@/config/permissions'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/permissions')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.permissionRead)(context)
    await ensureNamespaces(['permissions', 'roles'])
  },
  component: PermissionsPage,
})
