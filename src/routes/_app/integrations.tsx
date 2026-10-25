import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { IntegrationsPage } from '@/features/integrations/components/integrations-page'
import { validateIntegrationsSearch, type IntegrationsSearch } from '@/features/integrations/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/integrations')({
  validateSearch: validateIntegrationsSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.integrationRead)(context)
    await ensureNamespaces(['integrations', 'audit'])
  },
  component: IntegrationsRoute,
})

function IntegrationsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: IntegrationsSearch) => IntegrationsSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <IntegrationsPage search={search} onSearchChange={onSearchChange} />
}
