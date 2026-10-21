import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { UsersPage } from '@/features/users/components/users-page'
import { validateUsersSearch, type UsersSearch } from '@/features/users/search'
import { PERMISSION_CODES } from '@/config/permissions'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/users')({
  validateSearch: validateUsersSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.userRead)(context)
    await ensureNamespaces(['users', 'roles', 'validation'])
  },
  component: UsersRoute,
})

function UsersRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: UsersSearch) => UsersSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <UsersPage search={search} onSearchChange={onSearchChange} />
}
