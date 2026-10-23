import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { DepartmentsPage } from '@/features/departments/components/departments-page'
import { validateDepartmentsSearch, type DepartmentsSearch } from '@/features/departments/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/departments')({
  validateSearch: validateDepartmentsSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.departmentRead)(context)
    await ensureNamespaces(['departments', 'validation'])
  },
  component: DepartmentsRoute,
})

function DepartmentsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: DepartmentsSearch) => DepartmentsSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <DepartmentsPage search={search} onSearchChange={onSearchChange} />
}
