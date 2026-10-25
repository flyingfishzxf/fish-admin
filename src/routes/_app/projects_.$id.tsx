import { createFileRoute } from '@tanstack/react-router'

import { PERMISSION_CODES } from '@/config/permissions'
import { ProjectDetailPage } from '@/features/projects/components/project-detail-page'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/projects_/$id')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.projectRead)(context)
    await ensureNamespaces(['projects', 'common', 'audit', 'validation'])
  },
  component: ProjectDetailRoute,
})

function ProjectDetailRoute() {
  const { id } = Route.useParams()
  return <ProjectDetailPage projectId={id} />
}
