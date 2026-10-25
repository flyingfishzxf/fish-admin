import { describe, expect, it } from 'vitest'

import { DEFAULT_NOTIFICATIONS_SEARCH, validateNotificationsSearch } from './search'

describe('notifications search', () => {
  it('falls back to defaults', () => {
    expect(validateNotificationsSearch({})).toEqual(DEFAULT_NOTIFICATIONS_SEARCH)
  })

  it('clamps paging values', () => {
    expect(validateNotificationsSearch({ page: '0', pageSize: '2' })).toMatchObject({
      page: 1,
      pageSize: 10,
    })
    expect(validateNotificationsSearch({ page: '3.7', pageSize: '20' })).toMatchObject({
      page: 3,
      pageSize: 20,
    })
    expect(validateNotificationsSearch({ pageSize: '500' }).pageSize).toBe(10)
  })

  it('keeps known filters and deep links', () => {
    expect(
      validateNotificationsSearch({
        filter: 'unread',
        notification: 'notification-3',
        page: '2',
      }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      filter: 'unread',
      notification: 'notification-3',
    })
  })

  it('drops unknown filters and empty deep links', () => {
    expect(validateNotificationsSearch({ filter: 'archived', notification: '' })).toEqual(
      DEFAULT_NOTIFICATIONS_SEARCH,
    )
  })
})
