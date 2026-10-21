import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import { dashboardQueryOptions } from '@/features/dashboard/queries'
import { permissionsQueryOptions } from '@/features/permissions/queries'
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
})
