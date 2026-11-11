import type { User } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { deleteUser } from './api'
import DeleteUserDialog from './DeleteUserDialog.vue'

vi.mock('./api', () => ({ deleteUser: vi.fn() }))

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

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountDialog() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  wrapper = mount(DeleteUserDialog, {
    props: { user: ada },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function confirmButton() {
  const button = Array.from(document.body.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === 'Delete user',
  )
  expect(button).toBeTruthy()
  return button as HTMLButtonElement
}

describe('DeleteUserDialog', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('deletes the user, refreshes the list and closes itself', async () => {
    mountDialog()
    await flushPromises()
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    confirmButton().dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(deleteUser).toHaveBeenCalledWith('u1')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(wrapper!.emitted('update:user')).toEqual([[null]])
  })
})
