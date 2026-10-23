import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import { fetchDashboard } from '@/features/dashboard/api'
import { fetchPermissions } from '@/features/permissions/api'
import { updateProfile } from '@/features/profile/api'
import { fetchRoleOptions, fetchRoles, updateRolePermissions } from '@/features/roles/api'
import { resetDemoData } from '@/features/settings/api'
import {
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  createUser,
  deleteUser,
  fetchUser,
  fetchUserActivity,
  fetchUsers,
  restoreUsers,
  updateUser,
  updateUserProfile,
} from '@/features/users/api'

const userInput = {
  name: 'Ada Lovelace',
  email: 'ada@fish.dev',
  roleId: 'role_viewer',
  status: 'active' as const,
  departmentId: 'dept-engineering',
}

describe('feature API clients', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
  })

  it('serializes the user list query', () => {
    fetchUsers({
      page: 2,
      pageSize: 20,
      q: 'ada lovelace',
      roleId: 'role_admin',
      status: 'active',
      departmentId: 'dept-engineering',
      includeDescendants: true,
      sort: 'name',
      order: 'asc',
    })

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/users?page=2&pageSize=20&q=ada+lovelace&roleId=role_admin&status=active&departmentId=dept-engineering&includeDescendants=1&sort=name&order=asc',
    )
  })

  it('omits empty user filters', () => {
    fetchUsers({ page: 1, pageSize: 10 })

    expect(apiRequestMock).toHaveBeenCalledWith('/users?page=1&pageSize=10')
  })

  it('sends user mutations', () => {
    createUser(userInput)
    updateUser('user_1', { ...userInput, name: 'Grace' })
    deleteUser('user_1')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/users', {
      method: 'POST',
      body: userInput,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/users/user_1', {
      method: 'PATCH',
      body: { ...userInput, name: 'Grace' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/users/user_1', { method: 'DELETE' })
  })

  it('loads a user detail, updates the profile and fetches user activity', () => {
    fetchUser('user_1')
    updateUserProfile('user_1', { tags: ['design'], jobTitle: 'Lead' })
    fetchUserActivity('user_1', 5)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/users/user_1')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/users/user_1', {
      method: 'PATCH',
      body: { tags: ['design'], jobTitle: 'Lead' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/audit-events?entityType=user&entityId=user_1&page=1&pageSize=5',
    )
  })

  it('loads roles and saves role permissions', () => {
    fetchRoles()
    fetchRoleOptions()
    updateRolePermissions('role_manager', ['user:read'])

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/roles')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/roles/options')
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/roles/role_manager/permissions', {
      method: 'PUT',
      body: { permissions: ['user:read'] },
    })
  })

  it('loads permissions, dashboard data and updates the profile', () => {
    fetchPermissions()
    fetchDashboard(30)
    updateProfile({ name: 'Ada', bio: 'Math' })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/permissions')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/dashboard?range=30')
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/profile', {
      method: 'PATCH',
      body: { name: 'Ada', bio: 'Math' },
    })
  })

  it('resets the demo data', () => {
    resetDemoData()

    expect(apiRequestMock).toHaveBeenCalledWith('/__mock/reset', { method: 'POST' })
  })

  it('sends user bulk actions', () => {
    bulkUpdateUserStatus(['user_1', 'user_2'], 'inactive')
    bulkDeleteUsers(['user_1'])
    restoreUsers(['user_1'])

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/users/bulk-status', {
      method: 'POST',
      body: { ids: ['user_1', 'user_2'], status: 'inactive' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/users/bulk-delete', {
      method: 'POST',
      body: { ids: ['user_1'] },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/users/restore', {
      method: 'POST',
      body: { ids: ['user_1'] },
    })
  })
})
