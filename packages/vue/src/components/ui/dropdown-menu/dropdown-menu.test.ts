import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import DropdownMenu from './DropdownMenu.vue'
import DropdownMenuContent from './DropdownMenuContent.vue'
import DropdownMenuItem from './DropdownMenuItem.vue'
import DropdownMenuTrigger from './DropdownMenuTrigger.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function mountMenu(onSelect: () => void, side?: 'top' | 'right' | 'bottom' | 'left') {
  return mount(DropdownMenu, {
    slots: {
      default: () => [
        h(DropdownMenuTrigger, { asChild: true }, () => h('button', { type: 'button' }, 'Actions')),
        h(DropdownMenuContent, { align: 'end', side }, () => [
          h(DropdownMenuItem, { onSelect }, () => 'Edit'),
          h(DropdownMenuItem, { variant: 'destructive', onSelect }, () => 'Delete'),
        ]),
      ],
    },
    attachTo: document.body,
  })
}

describe('DropdownMenu', () => {
  it('opens from the trigger and invokes the item handler', async () => {
    const onSelect = vi.fn()
    wrapper = mountMenu(onSelect)

    const trigger = wrapper.get('button')
    await trigger.trigger('keydown', { key: 'Enter' })
    await nextTick()

    const items = document.body.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]')
    expect(items).toHaveLength(2)
    items[0]?.click()
    await vi.waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1))
  })

  it('marks destructive items and closes on select', async () => {
    wrapper = mountMenu(() => {})
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()

    const destructive = document.body.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-item"][data-variant="destructive"]',
    )
    expect(destructive?.className).toContain('text-destructive')

    destructive?.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('[data-slot="dropdown-menu-content"]')).toBeNull()
    })
  })

  it('forwards the side instead of warning about a fallthrough attribute', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    wrapper = mountMenu(() => {}, 'top')
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()

    const content = document.body.querySelector<HTMLElement>('[data-slot="dropdown-menu-content"]')
    expect(content).not.toBeNull()
    // Reka writes the resolved side back onto the popper wrapper, so this also
    // covers the placement reaching the primitive rather than just the prop.
    expect(
      content?.closest('[data-side]')?.getAttribute('data-side') ??
        content?.getAttribute('data-side'),
    ).toBe('top')
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Extraneous non-props attributes'),
    )
    warn.mockRestore()
  })
})
