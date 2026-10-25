import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { PERMISSION_CODES } from '@/config/permissions'
import { FilesPage } from '@/features/files/components/files-page'
import { validateFilesSearch, type FilesSearch } from '@/features/files/search'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/files')({
  validateSearch: validateFilesSearch,
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.fileRead)(context)
    await ensureNamespaces(['files', 'common'])
  },
  component: FilesRoute,
})

function FilesRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: FilesSearch) => FilesSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <FilesPage search={search} onSearchChange={onSearchChange} />
}
