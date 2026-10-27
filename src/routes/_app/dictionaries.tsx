import { createFileRoute } from '@tanstack/react-router'

import { PERMISSION_CODES } from '@/config/permissions'
import { DictionariesPage } from '@/features/dictionaries/components/dictionaries-page'
import { requirePermission } from '@/lib/auth'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/dictionaries')({
  beforeLoad: async (context) => {
    requirePermission(PERMISSION_CODES.dictionaryRead)(context)
    await ensureNamespaces(['dictionaries', 'common', 'validation'])
  },
  component: DictionariesPage,
})
