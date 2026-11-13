export type IntegrationStatusFilter = 'all' | 'enabled' | 'disabled'

export interface IntegrationsSearch {
  page: number
  pageSize: number
  provider?: string
  status: IntegrationStatusFilter
}

// Two cards per row, six per page: the mock accepts 1–24, so this stays a
// presentation choice rather than an API constraint.
export const INTEGRATION_PAGE_SIZE = 6

export const DEFAULT_INTEGRATIONS_SEARCH: IntegrationsSearch = {
  page: 1,
  pageSize: INTEGRATION_PAGE_SIZE,
  status: 'all',
}

export const INTEGRATION_STATUS_FILTERS: IntegrationStatusFilter[] = ['all', 'enabled', 'disabled']
