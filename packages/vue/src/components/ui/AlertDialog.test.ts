import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AlertDialog from './AlertDialog.vue'

const baseProps = {
  title: 'Revoke session',
  description: 'This signs the device out immediately.',
  confirmLabel: 'Revoke',
  cancelLabel: 'Cancel',
}

describe('AlertDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders an alertdialog with its copy once opened', async () => {
    const wrapper = mount(AlertDialog, { props: { ...baseProps, open: true } })
    await flushPromises()

    const dialog = document.body.querySelector<HTMLElement>('[role="alertdialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.textContent).toContain('Revoke session')
    expect(dialog?.textContent).toContain('This signs the device out immediately.')
    expect(dialog?.textContent).toContain('Cancel')
    expect(dialog?.textContent).toContain('Revoke')
    expect(dialog?.className).toContain('data-[state=open]:zoom-in-95')
    wrapper.unmount()
  })

  it('puts the initial focus on the safe action', async () => {
    const wrapper = mount(AlertDialog, { props: { ...baseProps, open: true } })
    await flushPromises()

    const cancel = document.body.querySelector<HTMLElement>('[data-action="cancel"]')
    expect(cancel).toBeTruthy()
    await vi.waitFor(() => expect(document.activeElement).toBe(cancel))
    wrapper.unmount()
  })

  it('emits confirm without closing, so the caller can await the mutation', async () => {
    const wrapper = mount(AlertDialog, { props: { ...baseProps, open: true } })
    await flushPromises()

    const confirm = document.body.querySelector<HTMLElement>('[data-action="confirm"]')
    confirm!.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toBeUndefined()
    wrapper.unmount()
  })

  it('closes from the cancel action', async () => {
    const wrapper = mount(AlertDialog, { props: { ...baseProps, open: true } })
    await flushPromises()

    const cancel = document.body.querySelector<HTMLElement>('[data-action="cancel"]')
    cancel!.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    wrapper.unmount()
  })

  it('disables both actions while a mutation is pending', async () => {
    const wrapper = mount(AlertDialog, { props: { ...baseProps, open: true, pending: true } })
    await flushPromises()

    const cancel = document.body.querySelector<HTMLButtonElement>('[data-action="cancel"]')
    const confirm = document.body.querySelector<HTMLButtonElement>('[data-action="confirm"]')
    expect(cancel?.disabled).toBe(true)
    expect(confirm?.disabled).toBe(true)
    wrapper.unmount()
  })
})
