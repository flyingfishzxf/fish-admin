import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { ReportsPage } from '@/features/reports/components/reports-page'
import { validateReportsSearch, type ReportsSearch } from '@/features/reports/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/reports')({
  validateSearch: validateReportsSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.reportRead)(context)
    await ensureNamespaces(['reports', 'common'])
  },
  component: ReportsRoute,
})

function ReportsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: ReportsSearch) => ReportsSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <ReportsPage search={search} onSearchChange={onSearchChange} />
}
