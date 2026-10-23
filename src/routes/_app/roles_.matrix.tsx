import { createFileRoute } from '@tanstack/react-router'

import { PERMISSION_CODES } from '@/config/permissions'
import { RoleMatrixPage } from '@/features/roles/components/role-matrix-page'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/roles_/matrix')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.roleRead)(context)
    await ensureNamespaces(['roles', 'validation'])
  },
  component: RoleMatrixPage,
})
