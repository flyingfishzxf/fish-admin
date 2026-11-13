import type { PermissionDefinition } from '@fish-admin/contracts/permissions'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchPermissions } from './api'
import PermissionsPage from './PermissionsPage.vue'

vi.mock('./api', () => ({ fetchPermissions: vi.fn() }))

// Deliberately not in contract order: the page must group by `PERMISSION_GROUPS`
// (dashboard → user → role → demo), not by the order the API returned.
const items: PermissionDefinition[] = [
  {
    code: 'role:read',
    group: 'role',
    labelKey: 'roles:permissionItems.roleRead',
    descriptionKey: 'roles:permissionItems.roleReadDescription',
  },
  {
    code: 'role:create',
    group: 'role',
    labelKey: 'roles:permissionItems.roleCreate',
    descriptionKey: 'roles:permissionItems.roleCreateDescription',
  },
  {
    code: 'demo:reset',
    group: 'demo',
    labelKey: 'roles:permissionItems.demoReset',
    descriptionKey: 'roles:permissionItems.demoResetDescription',
  },
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

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountPage() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(PermissionsPage, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function buttonWith(text: string, page: VueWrapper) {
  const button = page.findAll('button').find((candidate) => candidate.text().includes(text))
  expect(button).toBeTruthy()
  return button!
}

function groupHeadings(page: VueWrapper) {
  return page.findAll('th[scope="rowgroup"]').map((heading) => heading.text())
}

describe('PermissionsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchPermissions).mockResolvedValue(items)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
  })

  it('renders the registry grouped in contract order with labels, codes and descriptions', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    expect(page.get('table').attributes('aria-label')).toBe('Permissions')
    expect(page.text()).toContain('6 permissions registered')
    expect(page.text()).toContain('Create users')
    expect(page.text()).toContain('user:create')
    expect(page.text()).toContain('Invite new members to the workspace.')
    expect(page.text()).toContain('This page is read-only.')

    const headings = groupHeadings(page)
    expect(headings).toHaveLength(4)
    expect(headings[0]).toContain('Dashboard')
    expect(headings[1]).toContain('Users')
    expect(headings[2]).toContain('Roles')
    expect(headings[3]).toContain('Demo tools')
    // Groups with no permissions in the response are dropped, not rendered empty.
    expect(page.text()).not.toContain('Projects')
  })

  it('filters by permission code', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    await page.get('input[aria-label="Search"]').setValue('user:create')
    expect(page.text()).toContain('Create users')
    expect(page.text()).not.toContain('View users')
    // The header count always reflects the registry, not the filtered rows.
    expect(page.text()).toContain('6 permissions registered')
  })

  it('filters by the translated permission label', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    await page.get('input[aria-label="Search"]').setValue('view roles')
    expect(page.text()).toContain('role:read')
    expect(page.text()).not.toContain('Create roles')
    expect(page.text()).not.toContain('user:read')
  })

  it('filters by the translated module name', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    // "demo tools" appears only in the group label, never in the permission label.
    await page.get('input[aria-label="Search"]').setValue('demo tools')
    expect(page.text()).toContain('Reset demo data')
    expect(page.text()).not.toContain('View users')
  })

  it('filters by module keeping every permission of that module', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    page.findComponent(Select).vm.$emit('update:modelValue', 'role')
    await flushPromises()

    expect(page.text()).toContain('View roles')
    expect(page.text()).toContain('Create roles')
    expect(page.text()).not.toContain('Create users')
    expect(page.text()).not.toContain('View dashboard')
  })

  it('shows the empty state when nothing matches', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    await page.get('input[aria-label="Search"]').setValue('no-such-permission')
    expect(page.text()).toContain('No permissions found')
  })

  it('renders a skeleton while the registry loads', async () => {
    vi.mocked(fetchPermissions).mockReturnValue(new Promise(() => {}))
    const page = mountPage()

    await flushPromises()
    expect(page.findAll('[data-slot="skeleton"]')).toHaveLength(6)
    expect(page.find('table').exists()).toBe(false)
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchPermissions).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))

    vi.mocked(fetchPermissions).mockResolvedValue(items)
    await buttonWith('Try again', page).trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('View users'))
  })

  it('offers no write controls at all', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('View users'))

    const writeLike = page
      .findAll('button')
      .filter((button) => /new|create|edit|delete|save/i.test(button.text()))
    expect(writeLike).toHaveLength(0)
    expect(page.findAll('[data-action]')).toHaveLength(0)
  })
})
