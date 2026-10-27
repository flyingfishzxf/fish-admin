import { createFileRoute } from '@tanstack/react-router'

import { PERMISSION_CODES } from '@/config/permissions'
import { WorkflowDetailPage } from '@/features/workflows/components/workflow-detail-page'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/workflows_/$id')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.workflowRead)(context)
    await ensureNamespaces(['workflows', 'common'])
  },
  component: WorkflowDetailRoute,
})

function WorkflowDetailRoute() {
  const { id } = Route.useParams()
  return <WorkflowDetailPage workflowId={id} />
}
