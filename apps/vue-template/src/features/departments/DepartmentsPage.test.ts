import type { Department } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { createDepartment, fetchDepartments, updateDepartment } from './api'
import DepartmentsPage from './DepartmentsPage.vue'

vi.mock('./api', () => ({
  fetchDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
}))

function dept(
  id: string,
  name: string,
  parentId: string | null = null,
  extra: Partial<Department> = {},
): Department {
  return {
    id,
    name,
    parentId,
    directMemberCount: 2,
    memberCount: 4,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

const items = [
  dept('eng', 'Engineering'),
  dept('web', 'Web', 'eng', { managerName: 'Ada', directMemberCount: 5, memberCount: 9 }),
  dept('sales', 'Sales'),
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
  wrapper = mount(DepartmentsPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function fillName(value: string) {
  const input = document.body.querySelector<HTMLInputElement>('#department-name')
  expect(input).toBeTruthy()
  input!.value = value
  input!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function submitDialog() {
  // The submit button must really carry type=submit, otherwise a real click
  // would never trigger the form's @submit handler.
  expect(document.body.querySelector('button[type="submit"]')).toBeTruthy()
  const form = document.body.querySelector<HTMLFormElement>('form')
  expect(form).toBeTruthy()
  form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

function buttonWith(text: string, page: VueWrapper) {
  const button = page.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button).toBeTruthy()
  return button!
}

describe('DepartmentsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchDepartments).mockResolvedValue({ items })
    vi.mocked(createDepartment).mockResolvedValue(dept('support', 'Support'))
    vi.mocked(updateDepartment).mockResolvedValue(dept('eng', 'Platform'))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders the tree and the first department by default', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))

    expect(page.findAll('[role="treeitem"]')).toHaveLength(3)
    expect(page.get('#department-detail-heading').text()).toBe('Engineering')
    expect(page.text()).toContain('Top level')
    expect(page.text()).toContain('Unassigned')
  })

  it('updates the detail when another node is selected', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))

    await page.get('[data-dept-id="web"]').trigger('click')
    expect(page.get('#department-detail-heading').text()).toBe('Web')
    expect(page.findAll('dd')[0].text()).toBe('Engineering')
    expect(page.text()).toContain('Ada')
    expect(page.findAll('dd')[2].text()).toBe('5')
  })

  it('hides management controls without department:manage', async () => {
    const page = mountPage(['department:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))

    expect(page.text()).toContain('You can view departments, but not change them.')
    expect(page.text()).not.toContain('New department')
    expect(page.text()).not.toContain('New sub-department')
    expect(page.text()).not.toContain('Rename')
  })

  it('creates a root department and refreshes the list', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await buttonWith('New department', page).trigger('click')
    await flushPromises()
    await fillName('Support')
    await submitDialog()

    expect(createDepartment).toHaveBeenCalledWith({ name: 'Support', parentId: null })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['departments'] })
    await vi.waitFor(() => expect(page.text()).toContain('Department created.'))
  })

  it('renames the selected department', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await buttonWith('Rename', page).trigger('click')
    await flushPromises()
    await fillName('Platform')
    await submitDialog()

    expect(updateDepartment).toHaveBeenCalledWith('eng', { name: 'Platform' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['departments'] })
    await vi.waitFor(() => expect(page.text()).toContain('Department renamed.'))
  })

  it('creates a child under the selected department', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await buttonWith('New sub-department', page).trigger('click')
    await flushPromises()
    await fillName('Platform team')
    await submitDialog()

    expect(createDepartment).toHaveBeenCalledWith({ name: 'Platform team', parentId: 'eng' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['departments'] })
    await vi.waitFor(() => expect(page.text()).toContain('Department created.'))
  })

  it('rejects a name outside 2-40 characters before calling the API', async () => {
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))

    await buttonWith('New department', page).trigger('click')
    await flushPromises()
    await fillName('A')
    await submitDialog()

    expect(createDepartment).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'at least 2 characters',
    )
  })

  it.each([
    ['DEPARTMENT_NAME_TAKEN', 'already exists'],
    ['INVALID_PARENT', 'cannot contain'],
    ['VALIDATION_ERROR', 'Please fix'],
  ])('maps %s to its field message', async (code, expected) => {
    vi.mocked(createDepartment).mockRejectedValue(new ApiError(400, code, 'rejected'))
    const page = mountPage(['department:read', 'department:manage'])
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))

    await buttonWith('New department', page).trigger('click')
    await flushPromises()
    await fillName('Support')
    await submitDialog()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(expected)
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchDepartments).mockRejectedValue(new Error('boom'))
    const page = mountPage(['department:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Could not load departments.'))

    vi.mocked(fetchDepartments).mockResolvedValue({ items })
    await buttonWith('Try again', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Engineering'))
  })
})
