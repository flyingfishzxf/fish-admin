import { INTEGRATION_PROVIDERS } from '@/config/integrations'

export type IntegrationStatusFilter = 'all' | 'enabled' | 'disabled'

export interface IntegrationsSearch {
  page: number
  pageSize: number
  provider?: string
  status: IntegrationStatusFilter
}

export const DEFAULT_INTEGRATIONS_SEARCH: IntegrationsSearch = {
  page: 1,
  pageSize: 4,
  status: 'all',
}

export function validateIntegrationsSearch(search: Record<string, unknown>): IntegrationsSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const provider =
    typeof search.provider === 'string' && INTEGRATION_PROVIDERS.includes(search.provider as never)
      ? search.provider
      : undefined
  const status: IntegrationStatusFilter =
    search.status === 'enabled' || search.status === 'disabled' ? search.status : 'all'

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 2 && pageSize <= 24 ? Math.floor(pageSize) : 4,
    provider,
    status,
  }
}
