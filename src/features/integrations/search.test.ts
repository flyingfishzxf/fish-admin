import { describe, expect, it } from 'vitest'

import { DEFAULT_INTEGRATIONS_SEARCH, validateIntegrationsSearch } from './search'

describe('validateIntegrationsSearch', () => {
  it('falls back to defaults', () => {
    expect(validateIntegrationsSearch({})).toEqual(DEFAULT_INTEGRATIONS_SEARCH)
  })

  it('accepts a known provider and status', () => {
    expect(
      validateIntegrationsSearch({
        page: '2',
        pageSize: '8',
        provider: 'Stripe',
        status: 'enabled',
      }),
    ).toEqual({ page: 2, pageSize: 8, provider: 'Stripe', status: 'enabled' })
  })

  it('drops unknown providers and statuses', () => {
    expect(validateIntegrationsSearch({ provider: 'Zapier', status: 'broken' })).toEqual(
      DEFAULT_INTEGRATIONS_SEARCH,
    )
  })

  it('clamps invalid paging values', () => {
    const result = validateIntegrationsSearch({ page: '-2', pageSize: '500' })
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(4)
  })
})
