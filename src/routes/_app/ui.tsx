import { createFileRoute } from '@tanstack/react-router'

import { UiPlaygroundPage } from '@/features/playground/components/ui-playground-page'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/ui')({
  beforeLoad: async () => {
    await ensureNamespaces('ui')
  },
  component: UiPlaygroundPage,
})
