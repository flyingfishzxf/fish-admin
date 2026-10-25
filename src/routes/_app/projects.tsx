import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { ProjectsPage } from '@/features/projects/components/projects-page'
import { validateProjectsSearch, type ProjectsSearch } from '@/features/projects/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/projects')({
  validateSearch: validateProjectsSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.projectRead)(context)
    await ensureNamespaces(['projects', 'common', 'validation'])
  },
  component: ProjectsRoute,
})

function ProjectsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: ProjectsSearch) => ProjectsSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <ProjectsPage search={search} onSearchChange={onSearchChange} />
}
