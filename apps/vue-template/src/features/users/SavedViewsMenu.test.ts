import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import SavedViewsMenu from './SavedViewsMenu.vue'
import { DEFAULT_USERS_SEARCH } from './search'

let wrapper: VueWrapper | null = null

async function openMenu() {
  wrapper = mount(SavedViewsMenu, {
    props: { userId: 'admin', search: { ...DEFAULT_USERS_SEARCH } },
    attachTo: document.body,
  })
  await wrapper.get('[data-saved-views]').trigger('click')
  await flushPromises()
  return wrapper
}

function stored() {
  return JSON.parse(localStorage.getItem('fish-admin:users-views:admin') ?? '[]') as unknown[]
}

describe('SavedViewsMenu', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    localStorage.clear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('saves the current query under the typed name', async () => {
    await openMenu()

    const input = document.body.querySelector<HTMLInputElement>('[data-view-name]')!
    input.value = 'Inactive admins'
    input.dispatchEvent(new Event('input'))
    await flushPromises()

    document.body
      .querySelector<HTMLElement>('[data-view-save]')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(stored()).toHaveLength(1)
    expect((stored()[0] as { name: string }).name).toBe('Inactive admins')
    expect(document.body.textContent).toContain('View saved.')
    expect(document.body.querySelector('[data-saved-view="Inactive admins"]')).toBeTruthy()
  })

  it('refuses to save an unnamed view', async () => {
    await openMenu()

    const save = document.body.querySelector<HTMLButtonElement>('[data-view-save]')!
    expect(save.disabled).toBe(true)
    expect(stored()).toHaveLength(0)
  })

  it('applies a saved view and closes the popover', async () => {
    await openMenu()

    const input = document.body.querySelector<HTMLInputElement>('[data-view-name]')!
    input.value = 'Admins'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body
      .querySelector<HTMLElement>('[data-view-save]')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    document.body
      .querySelector<HTMLElement>('[data-saved-view="Admins"] button')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper!.emitted('apply')).toHaveLength(1)
    const view = wrapper!.emitted('apply')?.[0]?.[0] as { name: string } | undefined
    expect(view?.name).toBe('Admins')
  })

  it('deletes a view from storage', async () => {
    await openMenu()

    const input = document.body.querySelector<HTMLInputElement>('[data-view-name]')!
    input.value = 'Temps'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    document.body
      .querySelector<HTMLElement>('[data-view-save]')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()
    expect(stored()).toHaveLength(1)

    const row = document.body.querySelector<HTMLElement>('[data-saved-view="Temps"]')!
    row
      .querySelector<HTMLElement>('button[aria-label="Delete view"]')!
      .dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(stored()).toEqual([])
    expect(document.body.textContent).toContain('No saved views yet.')
  })
})
