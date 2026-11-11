import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Dialog from './Dialog.vue'
import DialogContent from './DialogContent.vue'
import DialogDescription from './DialogDescription.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Dialog', () => {
  it('renders its title, description and close button when open', async () => {
    const wrapper = mount(Dialog, {
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

    wrapper.unmount()
  })
})
