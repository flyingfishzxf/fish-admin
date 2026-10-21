import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/features/dashboard/components/dashboard-page'
import { PERMISSION_CODES } from '@/config/permissions'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'
import type { DashboardRange } from '@/types'

export const Route = createFileRoute('/_app/')({
  validateSearch: (search: Record<string, unknown>): { range?: DashboardRange } => {
    if (search.range === '30' || search.range === 30) return { range: 30 }
    if (search.range === '7' || search.range === 7) return { range: 7 }
    return {}
  },
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.dashboardRead)(context)
    await ensureNamespaces('dashboard')
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  const { range } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <DashboardPage
      range={range ?? 7}
      onRangeChange={(nextRange) => void navigate({ search: { range: nextRange }, replace: true })}
    />
  )
}
