import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { i18nReady } from '../../lib/i18n'
import Tour from './Tour.vue'
import type { TourStep } from './tour'

const STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    titleKey: 'tour.steps.sidebar.title',
    descriptionKey: 'tour.steps.sidebar.description',
    placement: 'right',
  },
  {
    target: '[data-tour="search"]',
    titleKey: 'tour.steps.search.title',
    descriptionKey: 'tour.steps.search.description',
  },
  {
    target: '[data-tour="notifications"]',
    titleKey: 'tour.steps.notifications.title',
    descriptionKey: 'tour.steps.notifications.description',
  },
  {
    target: '[data-tour="account"]',
    titleKey: 'tour.steps.account.title',
    descriptionKey: 'tour.steps.account.description',
  },
]

let wrapper: VueWrapper | null = null

function addAnchor(name: string) {
  const node = document.createElement('div')
  node.dataset.tour = name
  document.body.appendChild(node)
}

function popoverText() {
  return document.body.querySelector('[data-slot="tour-popover"]')?.textContent ?? ''
}

describe('Tour', () => {
  beforeEach(async () => {
    await i18nReady
    document.body.innerHTML = ''
    for (const name of ['sidebar', 'search', 'notifications', 'account']) addAnchor(name)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('walks the four steps in order', async () => {
    wrapper = mount(Tour, { props: { open: true, steps: STEPS }, attachTo: document.body })
    await flushPromises()

    expect(popoverText()).toContain('Navigate the workspace')
    expect(popoverText()).toContain('Step 1 of 4')

    await document.body.querySelector<HTMLElement>('[data-tour-action="next"]')?.click()
    await flushPromises()
    expect(popoverText()).toContain('Find anything fast')

    await document.body.querySelector<HTMLElement>('[data-tour-action="previous"]')?.click()
    await flushPromises()
    expect(popoverText()).toContain('Navigate the workspace')
  })

  it('closes on Escape', async () => {
    wrapper = mount(Tour, { props: { open: true, steps: STEPS }, attachTo: document.body })
    await flushPromises()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('skips a step whose anchor is missing', async () => {
    document.body.querySelector('[data-tour="notifications"]')?.remove()
    wrapper = mount(Tour, { props: { open: true, steps: STEPS }, attachTo: document.body })
    await flushPromises()

    // Jump from the search step straight to the account step.
    await document.body.querySelector<HTMLElement>('[data-tour-action="next"]')?.click()
    await flushPromises()
    await document.body.querySelector<HTMLElement>('[data-tour-action="next"]')?.click()
    await flushPromises()

    expect(popoverText()).toContain('Manage your account')
    expect(popoverText()).toContain('Step 4 of 4')
  })

  it('closes instead of opening when no anchor exists at all', async () => {
    document.body.innerHTML = ''
    wrapper = mount(Tour, { props: { open: true, steps: STEPS } })
    await flushPromises()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
    expect(document.body.querySelector('[data-slot="tour-popover"]')).toBeNull()
  })

  it('starts over on the first step each time it opens', async () => {
    wrapper = mount(Tour, { props: { open: true, steps: STEPS }, attachTo: document.body })
    await flushPromises()
    await document.body.querySelector<HTMLElement>('[data-tour-action="next"]')?.click()
    await flushPromises()

    await wrapper.setProps({ open: false })
    await flushPromises()
    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(popoverText()).toContain('Navigate the workspace')
  })
})
