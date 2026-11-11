import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import Dialog from './Dialog.vue'
import DialogContent from './DialogContent.vue'
import DialogDescription from './DialogDescription.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  // Unmount before clearing the body so a failed assertion cannot leave a Reka layer mounted
  // (document listeners / body pointer-events) for the next test.
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

describe('Dialog', () => {
  it('renders its title, description and close button when open', async () => {
    wrapper = mount(Dialog, {
      props: { open: true },
      slots: {
        default: () =>
          h(DialogContent, null, {
            default: () =>
              h(DialogHeader, null, {
                default: () => [
                  h(DialogTitle, null, { default: () => 'Invite a member' }),
                  h(DialogDescription, null, { default: () => 'They receive an email.' }),
                ],
              }),
          }),
      },
      attachTo: document.body,
    })
    await nextTick()

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.textContent).toContain('Invite a member')
    expect(dialog?.textContent).toContain('They receive an email.')
    expect(dialog?.querySelector('[data-slot="dialog-close"]')).toBeTruthy()
  })

  it('opens uncontrolled through defaultOpen when no open prop is passed', async () => {
    wrapper = mount(Dialog, {
      props: { defaultOpen: true },
      slots: {
        default: () =>
          h(DialogContent, null, {
            default: () => [
              h(DialogTitle, null, { default: () => 'Invite a member' }),
              h(DialogDescription, null, { default: () => 'They receive an email.' }),
            ],
          }),
      },
      attachTo: document.body,
    })
    await nextTick()

    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy()
  })

  it('labels the dialog with its title and closes from the close button', async () => {
    wrapper = mount(Dialog, {
      props: { defaultOpen: true },
      slots: {
        default: () =>
          h(DialogContent, null, {
            default: () => [
              h(DialogTitle, null, { default: () => 'Invite a member' }),
              h(DialogDescription, null, { default: () => 'They receive an email.' }),
            ],
          }),
      },
      attachTo: document.body,
    })
    await nextTick()

    const dialog = document.body.querySelector('[role="dialog"]')
    const title = dialog?.querySelector('[data-slot="dialog-title"]')
    expect(title).toBeTruthy()
    expect(dialog?.getAttribute('aria-labelledby')).toBe(title?.id)

    dialog?.querySelector<HTMLElement>('[data-slot="dialog-close"]')?.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    })
  })
})
