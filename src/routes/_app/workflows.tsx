import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { WorkflowsPage } from '@/features/workflows/components/workflows-page'
import { validateWorkflowsSearch, type WorkflowSearch } from '@/features/workflows/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/workflows')({
  validateSearch: validateWorkflowsSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.workflowRead)(context)
    await ensureNamespaces(['workflows', 'common', 'validation'])
  },
  component: WorkflowsRoute,
})

function WorkflowsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: WorkflowSearch) => WorkflowSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <WorkflowsPage search={search} onSearchChange={onSearchChange} />
}
