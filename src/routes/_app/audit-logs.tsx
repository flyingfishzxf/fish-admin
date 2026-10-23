import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { AuditLogsPage } from '@/features/audit/components/audit-logs-page'
import { validateAuditSearch, type AuditSearch } from '@/features/audit/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/audit-logs')({
  validateSearch: validateAuditSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.auditRead)(context)
    await ensureNamespaces(['audit', 'validation'])
  },
  component: AuditLogsRoute,
})

function AuditLogsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: AuditSearch) => AuditSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <AuditLogsPage search={search} onSearchChange={onSearchChange} />
}
