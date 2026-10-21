import { createFileRoute } from '@tanstack/react-router'

import { ProfilePage } from '@/features/profile/components/profile-page'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/profile')({
  beforeLoad: async () => {
    await ensureNamespaces(['profile', 'roles', 'validation'])
  },
  component: ProfilePage,
})
