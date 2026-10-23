import { createFileRoute } from '@tanstack/react-router'

import { ComponentCatalogPage } from '@/features/playground/components/component-catalog-page'
import { ensureNamespaces } from '@/lib/i18n'

export const Route = createFileRoute('/_app/components')({
  beforeLoad: async () => {
    await ensureNamespaces('catalog')
  },
  component: ComponentCatalogPage,
})
