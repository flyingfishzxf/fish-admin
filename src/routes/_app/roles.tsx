import { createFileRoute } from '@tanstack/react-router'

import { RolesPage } from '@/features/roles/components/roles-page'
import { PERMISSION_CODES } from '@/config/permissions'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/roles')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.roleRead)(context)
    await ensureNamespaces(['roles', 'validation'])
  },
  component: RolesPage,
})
