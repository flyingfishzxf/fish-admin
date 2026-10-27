import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock, session } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  session: { accessToken: 'access-token' as string | null },
}))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))
vi.mock('@/stores/auth-store', () => ({ useAuthStore: { getState: () => session } }))

import { dashboardQueryOptions } from '@/features/dashboard/queries'
import {
  dictionaryDetailQueryOptions,
  dictionaryListQueryOptions,
  dictionaryOptionsQueryOptions,
} from '@/features/dictionaries/queries'
import { fileFoldersQueryOptions, fileListQueryOptions } from '@/features/files/queries'
import {
  integrationDeliveriesQueryOptions,
  integrationListQueryOptions,
} from '@/features/integrations/queries'
import {
  notificationDetailQueryOptions,
  notificationListQueryOptions,
  notificationPreferencesQueryOptions,
  notificationSummaryQueryOptions,
} from '@/features/notifications/queries'
import { menuQueryOptions } from '@/features/navigation/queries'
import { permissionsQueryOptions } from '@/features/permissions/queries'
import {
  projectDetailQueryOptions,
  projectListQueryOptions,
  projectOverviewQueryOptions,
} from '@/features/projects/queries'
import { reportQueryOptions } from '@/features/reports/queries'
import { roleOptionsQueryOptions, rolesQueryOptions } from '@/features/roles/queries'
import { userListQueryOptions } from '@/features/users/queries'

const params = { page: 1, pageSize: 10 }

// Every query function must forward TanStack's signal, otherwise a superseded
// fetch keeps running against a real backend.
const controller = new AbortController()
const context = { signal: controller.signal } as never
const withSignal = { signal: controller.signal }

describe('query options', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue([])
    session.accessToken = 'access-token'
  })

  it('keys the user list by its parameters', async () => {
    const options = userListQueryOptions(params)

    expect(options.queryKey).toEqual(['users', params])
    await options.queryFn?.(context)
    expect(apiRequestMock).toHaveBeenCalledWith('/users?page=1&pageSize=10', withSignal)
  })

  it('keys roles and role options separately', async () => {
    const roles = rolesQueryOptions()
    const roleOptions = roleOptionsQueryOptions()

    expect(roles.queryKey).toEqual(['roles'])
    expect(roleOptions.queryKey).toEqual(['roles', 'options'])

    await roles.queryFn?.(context)
    await roleOptions.queryFn?.(context)
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/roles', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/roles/options', withSignal)
  })

  it('keys the dashboard by range', async () => {
    const options = dashboardQueryOptions(7)

    expect(options.queryKey).toEqual(['dashboard', 7])
    await options.queryFn?.(context)
    expect(apiRequestMock).toHaveBeenCalledWith('/dashboard?range=7', withSignal)
  })

  it('keys permissions', async () => {
    const options = permissionsQueryOptions()

    expect(options.queryKey).toEqual(['permissions'])
    await options.queryFn?.(context)
    expect(apiRequestMock).toHaveBeenCalledWith('/permissions', withSignal)
  })

  it('keys the project list, overview and detail separately', async () => {
    const params = { page: 2, pageSize: 6, status: 'active' as const }
    const list = projectListQueryOptions(params)
    const overview = projectOverviewQueryOptions()
    const detail = projectDetailQueryOptions('project-atl')

    expect(list.queryKey).toEqual(['projects', params])
    expect(overview.queryKey).toEqual(['projects', 'overview'])
    expect(detail.queryKey).toEqual(['projects', 'detail', 'project-atl'])

    await list.queryFn?.(context)
    await overview.queryFn?.(context)
    await detail.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/projects?page=2&pageSize=6&status=active',
      withSignal,
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/projects?page=1&pageSize=50', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/projects/project-atl', withSignal)
  })

  it('keys notification lists, summary, detail and preferences separately', async () => {
    const params = { page: 1, pageSize: 10, filter: 'unread' as const }
    const list = notificationListQueryOptions(params)
    const summary = notificationSummaryQueryOptions()
    const detail = notificationDetailQueryOptions('notification-1')
    const preferences = notificationPreferencesQueryOptions()

    expect(list.queryKey).toEqual(['notifications', params])
    expect(summary.queryKey).toEqual(['notifications', 'summary'])
    expect(detail.queryKey).toEqual(['notifications', 'detail', 'notification-1'])
    expect(preferences.queryKey).toEqual(['notifications', 'preferences'])

    await list.queryFn?.(context)
    await summary.queryFn?.(context)
    await detail.queryFn?.(context)
    await preferences.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/notifications?page=1&pageSize=10&filter=unread',
      withSignal,
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/notifications?page=1&pageSize=5&filter=all',
      withSignal,
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/notifications/notification-1', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, '/notifications/preferences', withSignal)
  })

  it('keys reports by range and granularity', async () => {
    const params = { from: '2026-09-01', to: '2026-09-30', granularity: 'week' as const }
    const options = reportQueryOptions(params)

    expect(options.queryKey).toEqual(['reports', params])
    await options.queryFn?.(context)
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/reports?from=2026-09-01&to=2026-09-30&granularity=week',
      withSignal,
    )
  })

  it('keys file folders and the file list separately', async () => {
    const params = {
      page: 1,
      pageSize: 12,
      folderId: 'folder-design',
      kind: 'image' as const,
      favorite: true,
    }
    const folders = fileFoldersQueryOptions()
    const list = fileListQueryOptions(params)

    expect(folders.queryKey).toEqual(['files', 'folders'])
    expect(list.queryKey).toEqual(['files', 'list', params])

    await folders.queryFn?.(context)
    await list.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/file-folders', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/files?page=1&pageSize=12&folderId=folder-design&kind=image&favorite=1',
      withSignal,
    )
  })

  it('keys integrations by filters and deliveries by connection', async () => {
    const filters = { page: 1, pageSize: 4, provider: 'Slack', enabled: true }
    const list = integrationListQueryOptions(filters)
    const deliveries = integrationDeliveriesQueryOptions('integration-1')

    expect(list.queryKey).toEqual(['integrations', filters])
    expect(deliveries.queryKey).toEqual(['integrations', 'deliveries', 'integration-1'])

    await list.queryFn?.(context)
    await deliveries.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/integrations?page=1&pageSize=4&provider=Slack&enabled=1',
      withSignal,
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/integrations/integration-1/deliveries',
      withSignal,
    )
  })

  it('keys dictionaries by list and detail, and exposes enabled options only', async () => {
    const list = dictionaryListQueryOptions()
    const detail = dictionaryDetailQueryOptions('user_tag')
    const options = dictionaryOptionsQueryOptions('user_tag')

    expect(list.queryKey).toEqual(['dictionaries', 'list'])
    expect(detail.queryKey).toEqual(['dictionaries', 'detail', 'user_tag'])
    expect(options.queryKey).toEqual(detail.queryKey)

    await list.queryFn?.(context)
    await detail.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/dictionaries', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/dictionaries/user_tag', withSignal)

    const selected = options.select?.({
      dictionary: {
        id: 'dict-user-tag',
        code: 'user_tag',
        name: 'User tags',
        description: '',
        isSystem: true,
        itemCount: 3,
        referenceCount: 1,
        createdAt: '2026-01-05T09:00:00.000Z',
        updatedAt: '2026-01-05T09:00:00.000Z',
      },
      items: [
        {
          id: 'item-owner',
          dictionaryId: 'dict-user-tag',
          label: 'Owner',
          value: 'owner',
          description: '',
          sortOrder: 0,
          enabled: true,
          isSystem: true,
          referenceCount: 1,
          createdAt: '2026-01-05T09:00:00.000Z',
          updatedAt: '2026-01-05T09:00:00.000Z',
        },
        {
          id: 'item-remote',
          dictionaryId: 'dict-user-tag',
          label: 'Remote',
          value: 'remote',
          description: '',
          sortOrder: 1,
          enabled: false,
          isSystem: true,
          referenceCount: 0,
          createdAt: '2026-01-05T09:00:00.000Z',
          updatedAt: '2026-01-05T09:00:00.000Z',
        },
      ],
    })

    expect(selected).toEqual([{ label: 'Owner', value: 'owner' }])
  })

  it('keys the menu once for the session and forwards its signal', async () => {
    const menu = menuQueryOptions()
    const budgeted = menuQueryOptions(2_000)

    expect(menu.queryKey).toEqual(['menu'])
    expect(menu.retry).toBe(false)

    await menu.queryFn?.(context)
    await budgeted.queryFn?.(context)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/menu', withSignal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/menu', {
      signal: controller.signal,
      timeoutMs: 2_000,
    })

    // The cache clear on logout wakes this observer with no token; a signed-out
    // client resolves to the shipped nav instead of asking for a 401.
    session.accessToken = null
    expect(await menu.queryFn?.(context)).toBeNull()
    expect(apiRequestMock).toHaveBeenCalledTimes(2)
  })
})
