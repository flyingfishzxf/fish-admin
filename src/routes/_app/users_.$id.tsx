import { createFileRoute } from '@tanstack/react-router'

import { PERMISSION_CODES } from '@/config/permissions'
import { UserDetailPage } from '@/features/users/components/user-detail-page'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/users_/$id')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.userRead)(context)
    await ensureNamespaces(['users', 'audit', 'validation'])
  },
  component: UserDetailRoute,
})

function UserDetailRoute() {
  const { id } = Route.useParams()
  return <UserDetailPage userId={id} />
}
