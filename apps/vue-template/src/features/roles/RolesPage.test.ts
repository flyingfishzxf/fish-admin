import type { Role } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { createRole, deleteRole, fetchRoles, updateRole } from './api'
import RolesPage from './RolesPage.vue'

vi.mock('./api', () => ({
  fetchRoles: vi.fn(),
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
    permissions: ['role:read'],
    isSystem: false,
    userCount: 0,
    ...extra,
  }
}

const items: Role[] = [
  role('r1', 'Admin', {
    isSystem: true,
    permissions: ['*'],
    userCount: 3,
    description: 'Full access',
  }),
  role('r2', 'Support', { userCount: 2, permissions: ['user:read', 'report:read'] }),
  role('r3', 'Viewer', { permissions: ['dashboard:read'] }),
]

const allPermissions = ['role:read', 'role:create', 'role:update', 'role:delete']

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountPage(permissions: string[]) {
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
  // The header links to the permission matrix, so the page needs a router.
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/roles', name: 'roles', component: RolesPage },
      { path: '/roles/matrix', name: 'roles-matrix', component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  wrapper = mount(RolesPage, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function fillInput(id: string, value: string) {
  const input = document.body.querySelector<HTMLInputElement>(`#${id}`)
  expect(input).toBeTruthy()
  input!.value = value
  input!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function submitDialog() {
  expect(document.body.querySelector('button[type="submit"]')).toBeTruthy()
  const form = document.body.querySelector<HTMLFormElement>('form')
  expect(form).toBeTruthy()
  form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

function actionButton(page: VueWrapper, id: string, action: string) {
  const button = page.find(`[data-role-id="${id}"][data-action="${action}"]`)
  expect(button.exists()).toBe(true)
  return button
}

function buttonWith(text: string, page: VueWrapper) {
  const button = page.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button).toBeTruthy()
  return button!
}

describe('RolesPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchRoles).mockResolvedValue(items)
    vi.mocked(createRole).mockResolvedValue(role('r4', 'Auditor'))
    vi.mocked(updateRole).mockResolvedValue(role('r2', 'Support lead'))
    vi.mocked(deleteRole).mockResolvedValue(undefined)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders roles with the system badge, counts and wildcard', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(page.get('[data-slot="table"]').attributes('aria-label')).toBe('Roles')
    expect(page.text()).toContain('System')
    expect(page.text()).toContain('All permissions')
    expect(page.text()).toContain('3 users')
    expect(page.text()).toContain('2 permissions')
  })

  it('links to the permission matrix even without write permissions', async () => {
    const page = mountPage(['role:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    const link = page.get('a[href="/roles/matrix"]')
    expect(link.text()).toBe('Permission matrix')
  })

  it('filters roles by name and description', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await page.get('input[aria-label="Search"]').setValue('viewer')
    expect(page.text()).toContain('Viewer description')
    expect(page.text()).not.toContain('Support description')
  })

  it('hides write controls when the matching permissions are missing', async () => {
    const page = mountPage(['role:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(page.text()).toContain('You can view roles, but not change their permissions.')
    expect(page.text()).not.toContain('New role')
    expect(page.findAll('[data-action]')).toHaveLength(0)
  })

  it('never offers rename or delete for a system role', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    expect(page.find('[data-role-id="r1"]').exists()).toBe(false)
    expect(page.find('[data-role-id="r2"][data-action="rename"]').exists()).toBe(true)
  })

  it('creates a role and refreshes the list', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await buttonWith('New role', page).trigger('click')
    await flushPromises()
    await fillInput('role-name', 'Auditor')
    await fillInput('role-description', 'Read only audits')
    await submitDialog()

    expect(createRole).toHaveBeenCalledWith({
      name: 'Auditor',
      description: 'Read only audits',
    })
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
    await vi.waitFor(() => expect(page.text()).toContain('Role created.'))
  })

  it('renames a role', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await actionButton(page, 'r2', 'rename').trigger('click')
    await flushPromises()
    await fillInput('role-name', 'Support lead')
    await submitDialog()

    expect(updateRole).toHaveBeenCalledWith('r2', { name: 'Support lead' })
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
    await vi.waitFor(() => expect(page.text()).toContain('Role renamed.'))
  })

  it('deletes a role', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await actionButton(page, 'r2', 'delete').trigger('click')
    await flushPromises()
    await submitDialog()

    expect(deleteRole).toHaveBeenCalledWith('r2')
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['roles'] })
    await vi.waitFor(() => expect(page.text()).toContain('Role deleted.'))
  })

  it('clamps the page after deleting the only row on the last page', async () => {
    const many = Array.from({ length: 11 }, (_, index) => role(`r${index}`, `Role ${index}`))
    vi.mocked(fetchRoles).mockResolvedValue(many)
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 2'))

    await page.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()
    expect(page.text()).toContain('Page 2 of 2')

    // Deleting the single row on page 2 leaves ten roles, so page 2 is gone.
    vi.mocked(fetchRoles).mockResolvedValue(many.slice(0, 10))
    await actionButton(page, 'r10', 'delete').trigger('click')
    await flushPromises()
    await submitDialog()

    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 1'))
  })

  it('rejects a short name before calling the API', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await buttonWith('New role', page).trigger('click')
    await flushPromises()
    await fillInput('role-name', 'A')
    await submitDialog()

    expect(createRole).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('between 2 and 40')
  })

  it('rejects a description over 200 characters before calling the API', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await buttonWith('New role', page).trigger('click')
    await flushPromises()
    await fillInput('role-name', 'Auditor')
    await fillInput('role-description', 'x'.repeat(201))
    await submitDialog()

    expect(createRole).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'at most 200 characters',
    )
  })

  it('maps a taken name to the field message', async () => {
    vi.mocked(createRole).mockRejectedValue(new ApiError(409, 'ROLE_NAME_TAKEN', 'taken'))
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await buttonWith('New role', page).trigger('click')
    await flushPromises()
    await fillInput('role-name', 'Support')
    await submitDialog()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('already exists')
  })

  it('maps the in-use delete error to its field message', async () => {
    vi.mocked(deleteRole).mockRejectedValue(new ApiError(409, 'ROLE_IN_USE', 'in use'))
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await actionButton(page, 'r2', 'delete').trigger('click')
    await flushPromises()
    await submitDialog()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('Move members')
  })

  it('disables submit until the create form is valid', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    const submit = () => document.body.querySelector<HTMLButtonElement>('button[type="submit"]')!

    await buttonWith('New role', page).trigger('click')
    await flushPromises()
    expect(submit().disabled).toBe(true)
    await fillInput('role-name', 'Auditor')
    expect(submit().disabled).toBe(false)
    await fillInput('role-description', 'x'.repeat(201))
    expect(submit().disabled).toBe(true)
  })

  it('keeps submit enabled in delete mode', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await actionButton(page, 'r2', 'delete').trigger('click')
    await flushPromises()
    const submit = document.body.querySelector<HTMLButtonElement>('button[type="submit"]')
    expect(submit?.disabled).toBe(false)
  })

  it('recomputes row actions when permissions change after mount', async () => {
    const page = mountPage(['role:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
    expect(page.findAll('[data-action]')).toHaveLength(0)

    const auth = useAuthStore()
    auth.user = { ...auth.user!, permissions: allPermissions }
    await flushPromises()

    expect(page.findAll('[data-action="rename"]').length).toBeGreaterThan(0)
    expect(page.findAll('[data-action="delete"]').length).toBeGreaterThan(0)
  })

  it('maps a protected-role error', async () => {
    vi.mocked(updateRole).mockRejectedValue(new ApiError(400, 'PROTECTED_ROLE', 'protected'))
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await actionButton(page, 'r2', 'rename').trigger('click')
    await flushPromises()
    await fillInput('role-name', 'Support lead')
    await submitDialog()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('Protected role')
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchRoles).mockRejectedValue(new Error('boom'))
    const page = mountPage(['role:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))

    vi.mocked(fetchRoles).mockResolvedValue(items)
    await buttonWith('Try again', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Support'))
  })

  it('shows the empty state when no roles match', async () => {
    const page = mountPage(allPermissions)
    await vi.waitFor(() => expect(page.text()).toContain('Support'))

    await page.get('input[aria-label="Search"]').setValue('no-such-role')
    expect(page.text()).toContain('No roles found')
  })
})
