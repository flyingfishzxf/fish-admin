import type { NotificationPreferences } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchNotificationPreferences, updateNotificationPreferences } from './api'
import NotificationPreferencesCard from './NotificationPreferencesCard.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchNotificationPreferences: vi.fn(),
    updateNotificationPreferences: vi.fn(),
  }
})

const stored: NotificationPreferences = {
  quietStart: '22:00',
  quietEnd: '08:00',
  digest: 'daily',
  channels: { inApp: true, email: true, push: false },
}

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

async function mountCard() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(NotificationPreferencesCard, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  await flushPromises()
  return wrapper
}

function action(name: 'save' | 'reset') {
  return wrapper!.get(`[data-preferences-action="${name}"]`)
}

describe('NotificationPreferencesCard', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchNotificationPreferences).mockResolvedValue(stored)
    vi.mocked(updateNotificationPreferences).mockImplementation(async (input) => input)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('starts clean, so both buttons are disabled', async () => {
    const card = await mountCard()

    expect(card.find('[data-preferences-card]').exists()).toBe(true)
    expect(card.get('[data-preferences-action="save"]').attributes('disabled')).toBeDefined()
    expect(card.get('[data-preferences-action="reset"]').attributes('disabled')).toBeDefined()
    expect(card.findAll('[data-channel-row]')).toHaveLength(3)
  })

  it('becomes dirty when a channel is switched and saves the whole payload', async () => {
    const card = await mountCard()

    await card.get('[data-channel="push"]').trigger('click')
    await flushPromises()

    expect(action('save').attributes('disabled')).toBeUndefined()
    await action('save').trigger('click')

    await vi.waitFor(() => expect(updateNotificationPreferences).toHaveBeenCalledTimes(1))
    expect(updateNotificationPreferences).toHaveBeenCalledWith({
      ...stored,
      channels: { ...stored.channels, push: true },
    })
    await vi.waitFor(() =>
      expect(card.get('[data-preferences-status]').text()).toContain('Preferences saved.'),
    )
  })

  it('resets the draft without writing to the server', async () => {
    const card = await mountCard()

    await card.get('[data-digest="weekly"]').trigger('change')
    await flushPromises()
    expect(action('reset').attributes('disabled')).toBeUndefined()

    await action('reset').trigger('click')
    await flushPromises()

    expect(card.get('[data-digest="daily"]').attributes('checked')).toBeDefined()
    expect(action('save').attributes('disabled')).toBeDefined()
    expect(updateNotificationPreferences).not.toHaveBeenCalled()
  })

  it('edits the quiet hours through native time inputs', async () => {
    const card = await mountCard()

    const start = card.get<HTMLInputElement>('[data-quiet="start"]')
    expect(start.attributes('type')).toBe('time')
    expect(start.element.value).toBe('22:00')

    start.element.value = '21:30'
    await start.trigger('input')
    await flushPromises()
    await action('save').trigger('click')

    await vi.waitFor(() => expect(updateNotificationPreferences).toHaveBeenCalledTimes(1))
    expect(vi.mocked(updateNotificationPreferences).mock.calls[0]![0].quietStart).toBe('21:30')
  })
})
