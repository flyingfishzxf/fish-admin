import type { Role } from '@fish-admin/contracts'
import type { PermissionDefinition } from '@fish-admin/contracts/permissions'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { fetchPermissions, fetchRoles, updateRolePermissions } from './api'
import RoleMatrixPage from './RoleMatrixPage.vue'

vi.mock('./api', () => ({
  fetchRoles: vi.fn(),
  fetchPermissions: vi.fn(),
  fetchRoleOptions: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  updateRolePermissions: vi.fn(),
}))

function role(id: string, name: string, extra: Partial<Role> = {}): Role {
  return {
    id,
    name,
    description: `${name} description`,
    permissions: [],
    isSystem: false,
    userCount: 0,
    ...extra,
  }
}

const permissionItems: PermissionDefinition[] = [
  {
    code: 'dashboard:read',
    group: 'dashboard',
    labelKey: 'roles:permissionItems.dashboardRead',
    descriptionKey: 'roles:permissionItems.dashboardReadDescription',
  },
  {
    code: 'user:read',
    group: 'user',
    labelKey: 'roles:permissionItems.userRead',
    descriptionKey: 'roles:permissionItems.userReadDescription',
  },
  {
    code: 'user:create',
    group: 'user',
    labelKey: 'roles:permissionItems.userCreate',
    descriptionKey: 'roles:permissionItems.userCreateDescription',
  },
]

const items: Role[] = [
  role('r1', 'Admin', { isSystem: true, permissions: ['*'] }),
  role('r2', 'Support', { permissions: ['user:read'] }),
  role('r3', 'Viewer', { permissions: ['dashboard:read'] }),
]

const allPermissions = ['role:read', 'role:update']

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

async function mountPage(permissions: string[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'admin',
    name: 'Admin',
    email: 'admin@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions,
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'

  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/roles', name: 'roles', component: { template: '<div />' } },
      { path: '/roles/matrix', name: 'roles-matrix', component: RoleMatrixPage },
    ],
  })
  await router.push('/roles/matrix')

  wrapper = mount(RoleMatrixPage, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function cell(page: VueWrapper, roleId: string, code: string) {
  const checkbox = page.find(`[data-role-id="${roleId}"][data-permission="${code}"]`)
  expect(checkbox.exists()).toBe(true)
  return checkbox
}

function groupCell(page: VueWrapper, roleId: string, group: string) {
  const checkbox = page.find(`[data-role-id="${roleId}"][data-group="${group}"]`)
  expect(checkbox.exists()).toBe(true)
  return checkbox
}

function buttonWith(text: string, page: VueWrapper) {
  const button = page.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button).toBeTruthy()
  return button!
}

describe('RoleMatrixPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchRoles).mockResolvedValue(items)
    vi.mocked(fetchPermissions).mockResolvedValue(permissionItems)
    vi.mocked(updateRolePermissions).mockResolvedValue(role('r2', 'Support'))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders one column per role and groups the permission catalogue', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(page.get('table').attributes('aria-label')).toBe('Permissions by role')
    expect(page.text()).toContain('Dashboard')
    expect(page.text()).toContain('View users')
    expect(page.text()).toContain('user:create')
    // The admin role is a wildcard, so the matrix locks it and says why.
    expect(page.text()).toContain('Always has every permission')
    expect(groupCell(page, 'r2', 'user').attributes('aria-label')).toBe('Support — Users')
  })

  it('shows the current grant state of every cell', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(cell(page, 'r2', 'user:read').attributes('data-state')).toBe('checked')
    expect(cell(page, 'r2', 'user:create').attributes('data-state')).toBe('unchecked')
    expect(cell(page, 'r3', 'dashboard:read').attributes('data-state')).toBe('checked')
    // Support holds part of the user group, so the group toggle is mixed.
    expect(groupCell(page, 'r2', 'user').attributes('data-state')).toBe('indeterminate')
    expect(groupCell(page, 'r3', 'user').attributes('data-state')).toBe('unchecked')
    expect(cell(page, 'r2', 'user:read').attributes('aria-label')).toBe('Support — View users')
  })

  it('saves a permission change and keeps it after the refetch', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    expect(page.text()).toContain('1 role has unsaved changes')
    expect(page.text()).not.toContain('Permissions saved.')

    const updated = items.map((item) =>
      item.id === 'r2' ? { ...item, permissions: ['user:read', 'user:create'] } : item,
    )
    vi.mocked(fetchRoles).mockResolvedValue(updated)

    await buttonWith('Save changes', page).trigger('click')
    await flushPromises()

    expect(updateRolePermissions).toHaveBeenCalledTimes(1)
    expect(updateRolePermissions).toHaveBeenCalledWith('r2', ['user:read', 'user:create'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
    await vi.waitFor(() => expect(page.text()).toContain('Permissions saved.'))
    await vi.waitFor(() =>
      expect(cell(page, 'r2', 'user:create').attributes('data-state')).toBe('checked'),
    )
    expect(page.text()).not.toContain('unsaved changes')
  })

  it('grants a whole group in one click', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await groupCell(page, 'r2', 'user').trigger('click')
    await flushPromises()
    await buttonWith('Save changes', page).trigger('click')
    await flushPromises()
    expect(updateRolePermissions).toHaveBeenCalledWith('r2', ['user:read', 'user:create'])
  })

  it('clears a fully granted group in one click', async () => {
    vi.mocked(fetchRoles).mockResolvedValue(
      items.map((item) =>
        item.id === 'r2' ? { ...item, permissions: ['user:read', 'user:create'] } : item,
      ),
    )
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    expect(groupCell(page, 'r2', 'user').attributes('data-state')).toBe('checked')

    await groupCell(page, 'r2', 'user').trigger('click')
    await flushPromises()
    await buttonWith('Save changes', page).trigger('click')
    await flushPromises()
    expect(updateRolePermissions).toHaveBeenCalledWith('r2', [])
  })

  it('discards the draft without calling the API', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    expect(page.text()).toContain('1 role has unsaved changes')

    await buttonWith('Discard', page).trigger('click')
    await flushPromises()

    expect(page.text()).not.toContain('unsaved changes')
    expect(cell(page, 'r2', 'user:create').attributes('data-state')).toBe('unchecked')
    expect(updateRolePermissions).not.toHaveBeenCalled()
  })

  it('is read-only without role:update', async () => {
    const page = await mountPage(['role:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(page.text()).toContain('You can view the matrix, but not change permissions.')
    expect(cell(page, 'r2', 'user:create').attributes('disabled')).toBeDefined()
    expect(groupCell(page, 'r2', 'user').attributes('disabled')).toBeDefined()

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    expect(page.text()).not.toContain('unsaved changes')
    expect(updateRolePermissions).not.toHaveBeenCalled()
  })

  it('locks the wildcard role for editors too', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(cell(page, 'r1', 'user:create').attributes('disabled')).toBeDefined()
    expect(cell(page, 'r1', 'user:create').attributes('data-state')).toBe('checked')
    expect(cell(page, 'r2', 'user:create').attributes('disabled')).toBeUndefined()
  })

  it('maps a protected-role rejection to its message and keeps the draft', async () => {
    vi.mocked(updateRolePermissions).mockRejectedValue(
      new ApiError(400, 'PROTECTED_ROLE', 'protected'),
    )
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    await buttonWith('Save changes', page).trigger('click')
    await flushPromises()

    expect(page.get('[role="alert"]').text()).toContain('Protected role')
    expect(page.text()).toContain('1 role has unsaved changes')
  })

  it('maps a forbidden rejection to the shared API message', async () => {
    vi.mocked(updateRolePermissions).mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'denied'))
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    await buttonWith('Save changes', page).trigger('click')
    await flushPromises()

    expect(page.get('[role="alert"]').text()).toContain("don't have permission")
  })

  it('keeps the saved state when the follow-up refetch fails', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    vi.mocked(updateRolePermissions).mockResolvedValue(
      role('r2', 'Support', { permissions: ['user:read', 'user:create'] }),
    )
    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()

    // The write succeeds, but the list cannot be reloaded: the cell must still
    // show the acknowledged permission instead of reverting to the old baseline.
    vi.mocked(fetchRoles).mockRejectedValue(new Error('offline'))
    await buttonWith('Save changes', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Permissions saved.'))
    expect(cell(page, 'r2', 'user:create').attributes('data-state')).toBe('checked')
  })

  it('reports that the current session needs a refresh when the own role changed', async () => {
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    // The admin role is locked, so edit the role the signed-in user holds by
    // pointing the session at Support instead.
    const auth = useAuthStore()
    auth.user = { ...auth.user!, roleId: 'r2', roleName: 'Support' }
    await flushPromises()

    await cell(page, 'r2', 'user:create').trigger('click')
    await flushPromises()
    await buttonWith('Save changes', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Permissions saved.'))
    expect(page.text()).toContain('Re-authenticate to see the new permissions')
  })

  it('shows the error state and retries both queries', async () => {
    vi.mocked(fetchPermissions).mockRejectedValue(new Error('boom'))
    const page = await mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))

    vi.mocked(fetchPermissions).mockResolvedValue(permissionItems)
    await buttonWith('Try again', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('View users'))
  })
})
