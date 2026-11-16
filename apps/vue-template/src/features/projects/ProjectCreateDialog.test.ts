import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { createProject, fetchProjectDepartments, fetchProjectUserOptions } from './api'
import ProjectCreateDialog from './ProjectCreateDialog.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    createProject: vi.fn(),
    fetchProjectDepartments: vi.fn(),
    fetchProjectUserOptions: vi.fn(),
  }
})

let wrapper: VueWrapper | null = null

function mountDialog() {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions: ['project:manage'],
    emailVerified: true,
    twoFactorEnabled: false,
  }
  wrapper = mount(ProjectCreateDialog, {
    props: { open: true },
    attachTo: document.body,
    global: {
      plugins: [
        pinia,
        [
          VueQueryPlugin,
          { queryClient: new QueryClient({ defaultOptions: { mutations: { retry: false } } }) },
        ],
      ],
    },
  })
  return wrapper
}

function field(selector: string) {
  return document.body.querySelector<HTMLInputElement>(selector)!
}

async function fill(selector: string, value: string) {
  const input = field(selector)
  input.value = value
  input.dispatchEvent(new Event('input'))
  await flushPromises()
}

async function click(selector: string) {
  document.body
    .querySelector<HTMLElement>(selector)!
    .dispatchEvent(new Event('click', { bubbles: true }))
  await flushPromises()
}

describe('ProjectCreateDialog', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchProjectUserOptions).mockResolvedValue([
      { id: 'u1', name: 'Ada Lovelace', email: 'ada@fish.dev', department: 'Engineering' },
    ])
    vi.mocked(fetchProjectDepartments).mockResolvedValue({ items: [] })
    vi.mocked(createProject).mockResolvedValue({ id: 'p9', name: 'Nebula' } as never)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('starts on the basics step with the owner preselected from the session', async () => {
    mountDialog()
    await flushPromises()

    expect(document.body.textContent).toContain('Basics')
    expect(document.body.querySelector('[aria-current="step"]')?.textContent).toContain('Basics')
    expect(field('[data-field="name"]')).not.toBeNull()
  })

  it('refuses to advance without a name', async () => {
    mountDialog()
    await flushPromises()

    await click('[data-create-next]')
    expect(document.body.querySelector('[data-create-error]')?.textContent).toContain(
      'Name is required.',
    )
    expect(document.body.querySelector('[data-field="owner"]')).toBeNull()
  })

  it('rejects a key that is not 2-6 letters', async () => {
    mountDialog()
    await flushPromises()

    await fill('[data-field="name"]', 'Nebula')
    await fill('[data-field="key"]', 'N1')
    await click('[data-create-next]')

    expect(document.body.querySelector('[data-create-error]')?.textContent).toContain('2-6 letters')
  })

  it('creates the project from the schedule step and closes', async () => {
    const dialog = mountDialog()
    await flushPromises()

    await fill('[data-field="name"]', 'Nebula')
    await fill('[data-field="key"]', 'neb')
    await fill('[data-field="description"]', 'A new bet.')
    await click('[data-create-next]')
    await flushPromises()
    await click('[data-create-submit]')
    await flushPromises()

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Nebula',
        key: 'NEB',
        description: 'A new bet.',
        ownerId: 'u1',
        status: 'planning',
        priority: 'medium',
        memberIds: ['u1'],
      }),
    )
    expect(dialog.emitted('created')?.[0]?.[0]).toBe('Nebula')
    expect(dialog.emitted('update:open')?.[0]?.[0]).toBe(false)
  })

  it('says the key is taken when the server answers 409', async () => {
    vi.mocked(createProject).mockRejectedValue(
      new ApiError(409, 'KEY_TAKEN', 'A project with this key already exists.'),
    )
    mountDialog()
    await flushPromises()

    await fill('[data-field="name"]', 'Nebula')
    await fill('[data-field="key"]', 'ATL')
    await click('[data-create-next]')
    await click('[data-create-submit]')
    await flushPromises()

    expect(document.body.querySelector('[data-create-error]')?.textContent).toContain(
      'This key is already in use.',
    )
    expect(wrapper?.emitted('created')).toBeUndefined()
  })
})
