import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/features/settings/components/settings-page'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/settings')({
  beforeLoad: async () => {
    await ensureNamespaces('settings')
  },
  component: SettingsPage,
})
