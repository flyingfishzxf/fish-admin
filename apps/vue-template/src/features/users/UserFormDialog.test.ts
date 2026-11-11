import type { Department, RoleOption, User } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { createUser } from './api'
import UserFormDialog from './UserFormDialog.vue'

vi.mock('./api', () => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}))

const roles: RoleOption[] = [{ id: 'r1', name: 'Admin' }]
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

function mountDialog() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  wrapper = mount(UserFormDialog, {
    props: { open: true, user: null, roles, departments },
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function field(selector: string) {
  const input = document.body.querySelector<HTMLInputElement>(selector)
  expect(input).not.toBeNull()
  return input as HTMLInputElement
}

async function type(selector: string, value: string) {
  const input = field(selector)
  input.value = value
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

async function submit() {
  const form = document.body.querySelector('form')
  expect(form).not.toBeNull()
  form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

describe('UserFormDialog', () => {
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

  it('creates a user from the filled form', async () => {
    mountDialog()
    await flushPromises()

    await type('#user-name', 'Ada Lovelace')
    await type('#user-email', 'ada@fish.dev')

    const selects = wrapper!.findAllComponents(Select)
    expect(selects).toHaveLength(3)
    selects[0].vm.$emit('update:modelValue', 'r1')
    selects[2].vm.$emit('update:modelValue', 'd1')
    await flushPromises()

    vi.mocked(createUser).mockResolvedValue({} as User)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await submit()

    expect(createUser).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@fish.dev',
      roleId: 'r1',
      status: 'active',
      departmentId: 'd1',
    })
    expect(invalidate).toHaveBeenCalled()
  })

  it('blocks submission and explains an invalid email', async () => {
    mountDialog()
    await flushPromises()

    await type('#user-name', 'Ada Lovelace')
    await type('#user-email', 'bad-email')

    await submit()

    expect(createUser).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('Enter a valid email address.')
  })
})
