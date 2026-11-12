import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import DetailDrawer from './DetailDrawer.vue'

describe('DetailDrawer', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a labelled dialog with the detail content', async () => {
    const wrapper = mount(DetailDrawer, {
      props: { open: true, title: 'Audit event', description: 'Request metadata' },
      slots: { default: '<p>Actor: admin</p>' },
    })
    await flushPromises()

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.textContent).toContain('Audit event')
    expect(dialog?.textContent).toContain('Request metadata')
    expect(dialog?.textContent).toContain('Actor: admin')
    wrapper.unmount()
  })

  it('closes on Escape and returns focus once the parent applies the close', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mount(DetailDrawer, { props: { open: false, title: 'Audit event' } })
    await wrapper.setProps({ open: true })
    await flushPromises()

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog).toBeTruthy()
    // With no visible summary the description is still registered, but hidden.
    const description = dialog!.querySelector('[data-slot="dialog-description"]')
    expect(description?.classList.contains('sr-only')).toBe(true)
    expect(description?.textContent).toContain('Audit event')

    dialog!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    // `open` is controlled, so the parent has to apply the close before the
    // dialog (and its focus restoration) goes away.
    expect(document.activeElement).not.toBe(trigger)

    await wrapper.setProps({ open: false })
    // Focus restoration is provided by Reka UI's dialog primitives, not by
    // this wrapper; assert the delivered behaviour rather than a private impl.
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger))
    wrapper.unmount()
  })

  it('emits close when the built-in close button is used', async () => {
    const wrapper = mount(DetailDrawer, {
      props: { open: true, title: 'Audit event', description: 'Request metadata' },
    })
    await flushPromises()

    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    const close = dialog?.querySelector<HTMLButtonElement>('[data-slot="dialog-close"]')
    expect(close).toBeTruthy()
    close!.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })
})
