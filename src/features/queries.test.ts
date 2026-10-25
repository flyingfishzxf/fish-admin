import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import { dashboardQueryOptions } from '@/features/dashboard/queries'
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

describe('query options', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue([])
  })

  it('keys the user list by its parameters', async () => {
    const options = userListQueryOptions(params)

    expect(options.queryKey).toEqual(['users', params])
    await options.queryFn?.({} as never)
    expect(apiRequestMock).toHaveBeenCalledWith('/users?page=1&pageSize=10')
  })

  it('keys roles and role options separately', async () => {
    const roles = rolesQueryOptions()
    const roleOptions = roleOptionsQueryOptions()

    expect(roles.queryKey).toEqual(['roles'])
    expect(roleOptions.queryKey).toEqual(['roles', 'options'])

    await roles.queryFn?.({} as never)
    await roleOptions.queryFn?.({} as never)
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/roles')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/roles/options')
  })

  it('keys the dashboard by range', async () => {
    const options = dashboardQueryOptions(7)

    expect(options.queryKey).toEqual(['dashboard', 7])
    await options.queryFn?.({} as never)
    expect(apiRequestMock).toHaveBeenCalledWith('/dashboard?range=7')
  })

  it('keys permissions', async () => {
    const options = permissionsQueryOptions()

    expect(options.queryKey).toEqual(['permissions'])
    await options.queryFn?.({} as never)
    expect(apiRequestMock).toHaveBeenCalledWith('/permissions')
  })

  it('keys the project list, overview and detail separately', async () => {
    const params = { page: 2, pageSize: 6, status: 'active' as const }
    const list = projectListQueryOptions(params)
    const overview = projectOverviewQueryOptions()
    const detail = projectDetailQueryOptions('project-atl')

    expect(list.queryKey).toEqual(['projects', params])
    expect(overview.queryKey).toEqual(['projects', 'overview'])
    expect(detail.queryKey).toEqual(['projects', 'detail', 'project-atl'])

    await list.queryFn?.({} as never)
    await overview.queryFn?.({} as never)
    await detail.queryFn?.({} as never)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/projects?page=2&pageSize=6&status=active')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/projects?page=1&pageSize=50')
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/projects/project-atl')
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

    await list.queryFn?.({} as never)
    await summary.queryFn?.({} as never)
    await detail.queryFn?.({} as never)
    await preferences.queryFn?.({} as never)

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/notifications?page=1&pageSize=10&filter=unread',
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/notifications?page=1&pageSize=5&filter=all')
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/notifications/notification-1')
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, '/notifications/preferences')
  })

  it('keys reports by range and granularity', async () => {
    const params = { from: '2026-09-01', to: '2026-09-30', granularity: 'week' as const }
    const options = reportQueryOptions(params)

    expect(options.queryKey).toEqual(['reports', params])
    await options.queryFn?.({} as never)
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/reports?from=2026-09-01&to=2026-09-30&granularity=week',
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

    await folders.queryFn?.({} as never)
    await list.queryFn?.({} as never)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/file-folders')
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/files?page=1&pageSize=12&folderId=folder-design&kind=image&favorite=1',
    )
  })

  it('keys integrations by filters and deliveries by connection', async () => {
    const filters = { page: 1, pageSize: 4, provider: 'Slack', enabled: true }
    const list = integrationListQueryOptions(filters)
    const deliveries = integrationDeliveriesQueryOptions('integration-1')

    expect(list.queryKey).toEqual(['integrations', filters])
    expect(deliveries.queryKey).toEqual(['integrations', 'deliveries', 'integration-1'])

    await list.queryFn?.({} as never)
    await deliveries.queryFn?.({} as never)

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      '/integrations?page=1&pageSize=4&provider=Slack&enabled=1',
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/integrations/integration-1/deliveries')
  })
})
