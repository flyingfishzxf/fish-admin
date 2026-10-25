import { createFileRoute } from '@tanstack/react-router'
import { useCallback } from 'react'

import { NotificationsPage } from '@/features/notifications/components/notifications-page'
import {
  validateNotificationsSearch,
  type NotificationsSearch,
} from '@/features/notifications/search'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/notifications')({
  validateSearch: validateNotificationsSearch,
  beforeLoad: async () => {
    await ensureNamespaces(['notifications', 'common'])
  },
  component: NotificationsRoute,
})

function NotificationsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const onSearchChange = useCallback(
    (updater: (previous: NotificationsSearch) => NotificationsSearch) => {
      void navigate({ search: (previous) => updater(previous), replace: true })
    },
    [navigate],
  )

  return <NotificationsPage search={search} onSearchChange={onSearchChange} />
}
