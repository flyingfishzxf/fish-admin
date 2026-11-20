import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import Popconfirm from './Popconfirm.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountPopconfirm(
  onConfirm: () => void,
  props: Partial<InstanceType<typeof Popconfirm>['$props']> = {},
) {
  wrapper = mount(Popconfirm, {
    props: {
      title: 'Delete this workflow?',
      description: 'Runs in progress are cancelled.',
      confirmLabel: 'Delete workflow',
      cancelLabel: 'Keep workflow',
      destructive: true,
      onConfirm,
      ...props,
    },
    slots: { trigger: '<button type="button">Delete workflow</button>' },
    attachTo: document.body,
  })
  return wrapper
}

function content() {
  return document.body.querySelector('[role="alertdialog"]')
}

describe('Popconfirm', () => {
  it('opens from the trigger and emits confirm, closing the popover', async () => {
    const onConfirm = vi.fn()
    const wrapper = mountPopconfirm(onConfirm)

    expect(content()).toBeNull()

    await wrapper.find('button').trigger('click')
    await nextTick()
    console.log('BODY:', document.body.innerHTML.slice(0, 1200))
    const popper = document.body.querySelector('[data-reka-popper-content-wrapper]')
    console.log('POPPER_HTML:', popper ? popper.innerHTML.slice(0, 500) : 'null')
    console.log('EMITTED:', JSON.stringify(wrapper.emitted()))
    await vi.waitFor(() => expect(content()).not.toBeNull())
    const panel = content()
    expect(panel!.textContent).toContain('Delete this workflow?')
    expect(panel!.textContent).toContain('Runs in progress are cancelled.')

    const confirm = [...panel!.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Delete workflow'),
    )
    expect(confirm).toBeDefined()
    await confirm!.click()

    expect(onConfirm).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => expect(content()).toBeNull())
  })

  it('renders the destructive confirm variant and honours cancel', async () => {
    const onConfirm = vi.fn()
    const wrapper = mountPopconfirm(onConfirm)

    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(content()).not.toBeNull())
    const panel = content()!
    const destructive = [...panel.querySelectorAll('button')].find((button) =>
      button.className.includes('destructive'),
    )
    expect(destructive).toBeDefined()

    const cancel = [...panel.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Keep workflow'),
    )
    await cancel!.click()

    expect(onConfirm).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(content()).toBeNull())
  })

  it('blocks opening while disabled', async () => {
    const wrapper = mountPopconfirm(vi.fn(), { disabled: true })

    await wrapper.find('button').trigger('click')
    expect(content()).toBeNull()
  })

  it('disables confirm and keeps the popover open while pending', async () => {
    const onConfirm = vi.fn()
    const wrapper = mountPopconfirm(onConfirm, { pending: true })

    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(content()).not.toBeNull())
    const panel = content()!
    const confirm = [...panel.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Delete workflow'),
    )
    expect(confirm!.hasAttribute('disabled')).toBe(true)
    expect(panel.getAttribute('aria-busy')).toBe('true')

    await confirm!.click()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(content()).not.toBeNull()
  })
})
