import type { Department, User } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { downloadCsv } from '../../lib/csv'
import { useAuthStore } from '../../stores/auth'
import UsersPage from './UsersPage.vue'
import {
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  deleteUser,
  fetchDepartments,
  fetchRoleOptions,
  fetchUsers,
  restoreUsers,
} from './api'

vi.mock('./api', () => ({
  fetchUsers: vi.fn(),
  fetchRoleOptions: vi.fn(),
  fetchDepartments: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  bulkUpdateUserStatus: vi.fn(),
  bulkDeleteUsers: vi.fn(),
  restoreUsers: vi.fn(),
}))

vi.mock('../../lib/csv', () => ({ downloadCsv: vi.fn(), toCsv: vi.fn() }))

const ada: User = {
  id: 'u1',
  name: 'Ada Lovelace',
  email: 'ada@fish.dev',
  roleId: 'r1',
  roleName: 'Admin',
  status: 'active',
  department: 'Engineering',
  departmentId: 'd1',
  tags: [],
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastActiveAt: '2024-02-01T00:00:00.000Z',
}

const departments: Department[] = [
  {
    id: 'd1',
    name: 'Engineering',
    parentId: null,
    directMemberCount: 3,
    memberCount: 3,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
]

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
  // The name cell is a RouterLink, so the page needs a router instance even
  // when the test never navigates.
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/users', name: 'users', component: UsersPage },
      { path: '/users/:id', name: 'user-detail', component: { template: '<div>detail</div>' } },
    ],
  })
  wrapper = mount(UsersPage, {
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function waitForRows(page: VueWrapper) {
  await vi.waitFor(() => expect(page.text()).toContain('Ada Lovelace'))
}

describe('UsersPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchUsers).mockResolvedValue({
      items: [ada],
      total: 1,
      page: 1,
      pageSize: 10,
      pageCount: 2,
    })
    vi.mocked(fetchRoleOptions).mockResolvedValue([{ id: 'r1', name: 'Admin' }])
    vi.mocked(fetchDepartments).mockResolvedValue({ items: departments })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders the default page sorted by newest first', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    expect(fetchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10, sort: 'createdAt', order: 'desc' }),
      expect.anything(),
    )
  })

  it('bands the columns the way the React table does', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    // A read-only viewer sees no actions column, and department is hidden by
    // default, so its group still shows once — four bands over eight leaves.
    expect(
      page.findAll('thead th[data-slot="table-group-head"]').map((cell) => cell.text()),
    ).toEqual(['Identity', 'Contact', 'Access', 'Activity'])
  })

  it('debounces the search box into the query', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    await page.get('input[aria-label="Search"]').setValue('Avery')

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'Avery', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('applies the status filter', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    // Role comes first in the filter row, status second.
    page.findAllComponents(Select)[1].vm.$emit('update:modelValue', 'inactive')
    await flushPromises()

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('pages with the external pager', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    await page.get('[aria-label="Next page"]').trigger('click')

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
        expect.anything(),
      ),
    )
  })

  it('clamps the pager when the server reports fewer pages', async () => {
    const page = mountPage(['user:read', 'user:delete'])
    await waitForRows(page)

    await page.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()

    // Once the last row is gone the API clamps page 2 back to page 1. This must
    // work for any refetch, not only for the delete that triggered it.
    vi.mocked(fetchUsers).mockResolvedValue({
      items: [ada],
      total: 1,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    })
    await queryClient.invalidateQueries({ queryKey: ['users'] })

    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 1'))
    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('returns to a valid page through the real delete flow', async () => {
    const page = mountPage(['user:read', 'user:delete'])
    await waitForRows(page)

    await page.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()

    let deleted = false
    vi.mocked(fetchUsers).mockImplementation(async (params) =>
      deleted
        ? { items: [ada], total: 1, page: 1, pageSize: 10, pageCount: 1 }
        : { items: [ada], total: 11, page: params.page, pageSize: 10, pageCount: 2 },
    )
    vi.mocked(deleteUser).mockImplementation(async () => {
      deleted = true
    })

    await page.get('[aria-label="Actions"]').trigger('click')
    const menuItem = Array.from(
      document.body.querySelectorAll('[data-slot="dropdown-menu-item"]'),
    ).find((item) => item.textContent?.trim() === 'Delete user')
    expect(menuItem).toBeTruthy()
    menuItem!.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    const confirm = Array.from(document.body.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete user',
    )
    expect(confirm).toBeTruthy()
    confirm!.dispatchEvent(new Event('click', { bubbles: true }))

    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 1'))
  })

  it('sorts by the joined header button', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)
    expect(page.get('th[aria-sort="descending"]').text()).toContain('Joined')

    const joined = page.findAll('button').find((button) => button.text().includes('Joined'))
    expect(joined).toBeTruthy()
    await joined!.trigger('click')

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'createdAt', order: 'asc' }),
        expect.anything(),
      ),
    )
    await vi.waitFor(() => expect(page.get('th[aria-sort="ascending"]').text()).toContain('Joined'))
  })

  it('hides creation and row actions from a read-only viewer', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    expect(page.text()).not.toContain('Add user')
    expect(page.findAll('[aria-label="Actions"]')).toHaveLength(0)
  })

  it('offers edit but not delete to a manager', async () => {
    const page = mountPage(['user:read', 'user:update'])
    await waitForRows(page)

    await page.get('[aria-label="Actions"]').trigger('click')

    await vi.waitFor(() => expect(document.body.textContent).toContain('Edit user'))
    expect(document.body.textContent).not.toContain('Delete user')
  })

  it('filters by role', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    page.findAllComponents(Select)[0].vm.$emit('update:modelValue', 'r1')
    await flushPromises()

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'r1', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('changes the page size', async () => {
    const page = mountPage(['user:read'])
    await waitForRows(page)

    // Role, status, then the page-size select in the pager.
    page.findAllComponents(Select)[2].vm.$emit('update:modelValue', '50')
    await flushPromises()

    await vi.waitFor(() =>
      expect(fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 50, page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('remembers the density and repaints the rows', async () => {
    const page = mountPage(['user:read', 'user:update'])
    await waitForRows(page)

    expect(page.get('tbody td').classes()).toContain('py-3')
    await page.get('[data-segmented-option="compact"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('fish-admin:users-density')).toBe('compact')
    expect(page.get('[data-segmented-option="compact"]').attributes('aria-pressed')).toBe('true')
  })

  it('bulk deletes the selected rows and restores them on undo', async () => {
    vi.mocked(bulkDeleteUsers).mockResolvedValue({ deleted: ['u1'], skipped: [] })
    vi.mocked(restoreUsers).mockResolvedValue({ restored: [ada] })
    const page = mountPage(['user:read', 'user:delete'])
    await waitForRows(page)

    await page.get('[aria-label="Select Ada Lovelace"]').trigger('click')
    await flushPromises()

    const bar = page.get('[data-slot="bulk-actions-bar"]')
    expect(bar.text()).toContain('1 selected')

    const remove = bar.findAll('button').find((button) => button.text() === 'Delete')
    expect(remove).toBeTruthy()
    await remove!.trigger('click')
    await flushPromises()

    const confirm = document.body.querySelector('[data-action="confirm"]')
    expect(confirm).toBeTruthy()
    confirm!.dispatchEvent(new Event('click', { bubbles: true }))

    await vi.waitFor(() => expect(bulkDeleteUsers).toHaveBeenCalledWith(['u1']))
    await vi.waitFor(() => expect(page.text()).toContain('1 user deleted.'))

    // The undo button is the notice's action; it must die with the notice.
    await page.get('[data-notice-action]').trigger('click')
    await vi.waitFor(() => expect(restoreUsers).toHaveBeenCalledWith(['u1']))
  })

  it('updates the status of the selection', async () => {
    vi.mocked(bulkUpdateUserStatus).mockResolvedValue({ updated: ['u1'], skipped: [] })
    const page = mountPage(['user:read', 'user:update'])
    await waitForRows(page)

    await page.get('[aria-label="Select Ada Lovelace"]').trigger('click')
    await flushPromises()

    await page.get('[data-slot="bulk-actions-bar"] button').trigger('click')
    const items = Array.from(
      document.body.querySelectorAll('[data-slot="dropdown-menu-item"]'),
    ) as HTMLElement[]
    const invited = items.find((item) => item.textContent?.trim() === 'Invited')
    expect(invited).toBeTruthy()
    invited!.dispatchEvent(new Event('click', { bubbles: true }))

    await vi.waitFor(() => expect(bulkUpdateUserStatus).toHaveBeenCalledWith(['u1'], 'invited'))
  })

  it('exports every page the filters match', async () => {
    const grace: User = { ...ada, id: 'u2', name: 'Grace Hopper', email: 'grace@fish.dev' }
    vi.mocked(fetchUsers).mockImplementation(async (params) =>
      params.pageSize === 100
        ? params.page === 1
          ? { items: [ada], total: 2, page: 1, pageSize: 100, pageCount: 2 }
          : { items: [grace], total: 2, page: 2, pageSize: 100, pageCount: 2 }
        : { items: [ada, grace], total: 2, page: 1, pageSize: 10, pageCount: 1 },
    )
    const page = mountPage(['user:read'])
    await waitForRows(page)

    await page.get('[data-export-users]').trigger('click')

    await vi.waitFor(() => expect(downloadCsv).toHaveBeenCalled())
    const [filename, rows] = vi.mocked(downloadCsv).mock.calls[0]
    expect(filename).toMatch(/^users-\d{4}-\d{2}-\d{2}\.csv$/)
    // Header plus both pages, not just the two rows on screen.
    expect(rows).toHaveLength(3)
    expect(rows[2]).toContain('Grace Hopper')
    expect(page.text()).toContain('CSV exported.')
  })
})
