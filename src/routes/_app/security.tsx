import { createFileRoute } from '@tanstack/react-router'

import { SecurityPage } from '@/features/security/components/security-page'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/security')({
  beforeLoad: async () => {
    await ensureNamespaces(['security', 'auth', 'validation'])
  },
  component: SecurityPage,
})
