import type { User } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import {
  fetchDepartments,
  fetchRoleOptions,
  fetchUser,
  fetchUserActivity,
  fetchUserTagOptions,
  updateUserProfile,
} from './api'
import UserDetailPage from './UserDetailPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchUser: vi.fn(),
    fetchUserActivity: vi.fn(),
    fetchUserTagOptions: vi.fn(),
    fetchRoleOptions: vi.fn(),
    fetchDepartments: vi.fn(),
    updateUserProfile: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  }
})

const user: User = {
  id: 'u1',
  name: 'Ada Lovelace',
  email: 'ada@fish.dev',
  roleId: 'r1',
  roleName: 'Admin',
  status: 'active',
  department: 'Engineering',
  departmentPath: ['Technology', 'Engineering'],
  jobTitle: 'Principal Engineer',
  tags: ['core'],
  bio: 'Writes the first algorithm.',
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastActiveAt: '2026-11-13T10:00:00.000Z',
}

const EMPTY_PAGE = { items: [], total: 0, page: 1, pageSize: 20, pageCount: 1 }

let wrapper: VueWrapper | null = null

async function preparePage(
  permissions = ['user:read', 'user:update', 'user:delete', 'audit:read'],
) {
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

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/users', name: 'users', component: { template: '<div>list</div>' } },
      { path: '/users/:id', name: 'user-detail', component: UserDetailPage },
    ],
  })
  await router.push('/users/u1')
  await router.isReady()

  wrapper = mount(UserDetailPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return { page: wrapper, router }
}

async function mountPage(permissions?: string[]) {
  const result = await preparePage(permissions)
  await vi.waitFor(() => expect(result.page.text()).toContain('Ada Lovelace'))
  return result
}

function defaultMocks() {
  vi.mocked(fetchUser).mockResolvedValue(user)
  vi.mocked(fetchRoleOptions).mockResolvedValue([])
  vi.mocked(fetchDepartments).mockResolvedValue({ items: [] })
  vi.mocked(fetchUserActivity).mockResolvedValue(EMPTY_PAGE)
  vi.mocked(fetchUserTagOptions).mockResolvedValue({
    dictionary: {
      id: 'd1',
      code: 'user_tag',
      name: 'User tags',
      description: '',
      isSystem: false,
      itemCount: 2,
      referenceCount: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    items: [
      {
        id: 'i1',
        dictionaryId: 'd1',
        label: 'Design',
        value: 'Design',
        description: '',
        sortOrder: 0,
        enabled: true,
        isSystem: false,
        referenceCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'i2',
        dictionaryId: 'd1',
        label: 'Disabled',
        value: 'Disabled',
        description: '',
        sortOrder: 1,
        enabled: false,
        isSystem: false,
        referenceCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  vi.mocked(updateUserProfile).mockResolvedValue(user)
}

describe('UserDetailPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    defaultMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the identity header and all nine overview values', async () => {
    const { page } = await mountPage()

    expect(page.get('[data-user-name]').text()).toBe('Ada Lovelace')
    expect(page.text()).toContain('ada@fish.dev')
    expect(page.text()).toContain('Technology / Engineering')
    expect(page.text()).toContain('Principal Engineer')
    expect(page.text()).toContain('Writes the first algorithm.')
    expect(page.findAll('dl > div')).toHaveLength(9)
    expect(page.find('[data-slot="user-status-badge"]').exists()).toBe(true)
  })

  it('shows empty job title and bio placeholders instead of blank cells', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ ...user, jobTitle: undefined, bio: undefined })
    const { page } = await mountPage()

    expect(page.text()).toContain('Not set')
    expect(page.text()).toContain('No bio yet.')
  })

  it('keeps a missing user on the page with a way back to the list', async () => {
    vi.mocked(fetchUser).mockRejectedValue(new ApiError(404, 'USER_NOT_FOUND', 'User not found.'))
    const { page, router } = await preparePage()
    await vi.waitFor(() => expect(page.find('[data-user-not-found]').exists()).toBe(true))

    // Not the global 404: the shell is still there and the button is in-page.
    expect(page.find('[data-user-not-found]').exists()).toBe(true)
    expect(page.text()).toContain('User not found')
    expect(page.find('[data-user-name]').exists()).toBe(false)

    await page.get('[data-user-not-found] button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('users')
  })

  it('offers a retry for any other error', async () => {
    vi.mocked(fetchUser).mockRejectedValue(new Error('offline'))
    const { page } = await preparePage()

    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))
    expect(page.find('[data-user-not-found]').exists()).toBe(false)
    expect(page.get('button').text()).toContain('Try again')
  })

  it('only shows the activity tab to audit readers', async () => {
    const withAudit = await mountPage(['user:read', 'user:update', 'user:delete', 'audit:read'])
    expect(withAudit.page.findAll('[data-slot="tabs-trigger"]')).toHaveLength(2)
    withAudit.page.unmount()
    wrapper = null

    const withoutAudit = await mountPage(['user:read'])
    expect(withoutAudit.page.findAll('[data-slot="tabs-trigger"]')).toHaveLength(1)
    expect(withoutAudit.page.text()).not.toContain('Activity')
  })

  it('hides edit and delete from a viewer', async () => {
    const { page } = await mountPage(['user:read'])
    expect(page.find('[data-action="edit-user"]').exists()).toBe(false)
    expect(page.find('[data-action="delete-user"]').exists()).toBe(false)
    expect((page.get('[data-slot="tag-field"]').element as HTMLInputElement).disabled).toBe(true)
  })

  it('never offers to delete the signed-in user', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ ...user, id: 'admin' })
    const { page } = await mountPage()
    expect(page.find('[data-action="edit-user"]').exists()).toBe(true)
    expect(page.find('[data-action="delete-user"]').exists()).toBe(false)
  })

  it('opens the shared edit dialog', async () => {
    const { page } = await mountPage()

    await page.get('[data-action="edit-user"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Edit user')
  })

  it('opens the shared delete dialog', async () => {
    const { page } = await mountPage()

    await page.get('[data-action="delete-user"]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Delete Ada Lovelace?')
  })

  it('saves tags with a patch that carries only the tags field', async () => {
    const { page } = await mountPage()
    const field = page.get('[data-slot="tag-field"]')

    await field.setValue('Design')
    await field.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(page.find('[data-action="save-tags"]').exists()).toBe(true)
    await page.get('[data-action="save-tags"]').trigger('click')
    await flushPromises()

    expect(updateUserProfile).toHaveBeenCalledWith('u1', { tags: ['core', 'Design'] })
    expect(page.get('[data-user-detail-notice]').text()).toContain('Tags updated.')
  })

  it('rejects a non-image avatar and removes an existing one', async () => {
    vi.mocked(fetchUser).mockResolvedValue({ ...user, avatar: 'data:image/webp;base64,abc' })
    const { page } = await mountPage()

    const input = page.get('[data-slot="dropzone-file"]')
    const bad = new File(['<svg/>'], 'avatar.svg', { type: 'image/svg+xml' })
    Object.defineProperty(input.element, 'files', { value: [bad], configurable: true })
    await input.trigger('change')
    await flushPromises()
    expect(page.get('[data-slot="dropzone-error"]').text()).toBe('Choose a PNG, JPG or WebP image.')

    await page.get('[data-action="remove-avatar"]').trigger('click')
    await flushPromises()
    expect(updateUserProfile).toHaveBeenCalledWith('u1', { avatar: '' })
    expect(page.get('[data-user-detail-notice]').text()).toContain('Avatar removed.')
  })
})
