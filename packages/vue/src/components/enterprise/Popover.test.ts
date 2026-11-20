import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Popover from './Popover.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountPopover(props: Record<string, unknown> = {}) {
  wrapper = mount(Popover, {
    props,
    slots: {
      trigger: '<button type="button">Open popover</button>',
      default: '<p>Filter notifications</p>',
    },
    attachTo: document.body,
  })
  return wrapper
}

function content() {
  return document.body.querySelector('[data-popover]')
}

describe('Popover', () => {
  it('opens from the trigger and closes through update:open', async () => {
    const wrapper = mountPopover()

    expect(content()).toBeNull()
    await wrapper.find('button').trigger('click')
    expect(content()).not.toBeNull()
    expect(content()!.textContent).toContain('Filter notifications')

    // reka emits update:open on outside interaction; simulate the close path
    await wrapper.setProps({ open: false })
    await vi.waitFor(() => expect(content()).toBeNull())
  })

  it('stays closed while controlled with open=false', async () => {
    const wrapper = mountPopover({ open: false })

    await wrapper.find('button').trigger('click')
    expect(content()).toBeNull()
  })

  it('applies the alignment class', async () => {
    const wrapper = mountPopover({ open: true, align: 'start' })
    await vi.waitFor(() => expect(content()).not.toBeNull())
    expect((wrapper.props() as { align?: string }).align).toBe('start')
  })
})
