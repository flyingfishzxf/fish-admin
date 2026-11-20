import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import DropdownMenu from './DropdownMenu.vue'
import DropdownMenuCheckboxItem from './DropdownMenuCheckboxItem.vue'
import DropdownMenuContent from './DropdownMenuContent.vue'
import DropdownMenuItem from './DropdownMenuItem.vue'
import DropdownMenuRadioGroup from './DropdownMenuRadioGroup.vue'
import DropdownMenuRadioItem from './DropdownMenuRadioItem.vue'
import DropdownMenuSub from './DropdownMenuSub.vue'
import DropdownMenuSubContent from './DropdownMenuSubContent.vue'
import DropdownMenuSubTrigger from './DropdownMenuSubTrigger.vue'
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

  it('renders checkbox and radio items with their indicators', async () => {
    const onChecked = vi.fn()
    wrapper = mount(DropdownMenu, {
      slots: {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h('button', { type: 'button' }, 'View options'),
          ),
          h(DropdownMenuContent, () => [
            h(
              DropdownMenuCheckboxItem,
              { checked: true, 'onUpdate:checked': onChecked },
              () => 'Grid lines',
            ),
            h(DropdownMenuRadioGroup, { modelValue: 'compact' }, () => [
              h(DropdownMenuRadioItem, { value: 'comfortable' }, () => 'Comfortable'),
              h(DropdownMenuRadioItem, { value: 'compact' }, () => 'Compact'),
            ]),
          ]),
        ],
      },
      attachTo: document.body,
    })
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()

    const checkbox = document.body.querySelector('[data-slot="dropdown-menu-checkbox-item"]')
    expect(checkbox).not.toBeNull()
    expect(checkbox?.querySelector('[data-state="checked"]')).not.toBeNull()
    const radios = document.body.querySelectorAll('[data-slot="dropdown-menu-radio-item"]')
    expect(radios).toHaveLength(2)
    expect(radios[0].getAttribute('data-state')).toBe('unchecked')
    expect(radios[1].getAttribute('data-state')).toBe('checked')

    const content = document.body.querySelector('[data-slot="dropdown-menu-content"]')!
    content
      .querySelector<HTMLElement>('[data-slot="dropdown-menu-checkbox-item"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(onChecked).toHaveBeenCalled()
  })

  it('opens a submenu from its trigger', async () => {
    wrapper = mount(DropdownMenu, {
      slots: {
        default: () => [
          h(DropdownMenuTrigger, { asChild: true }, () =>
            h('button', { type: 'button' }, 'Actions'),
          ),
          h(DropdownMenuContent, () => [
            h(DropdownMenuSub, () => [
              h(DropdownMenuSubTrigger, () => 'Share'),
              h(DropdownMenuSubContent, () =>
                h(DropdownMenuItem, { onSelect: () => undefined }, () => 'Copy link'),
              ),
            ]),
          ]),
        ],
      },
      attachTo: document.body,
    })
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })
    await nextTick()

    const subTrigger = document.body.querySelector('[data-slot="dropdown-menu-sub-trigger"]')!
    subTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(document.body.querySelector('[data-slot="dropdown-menu-sub-content"]')).not.toBeNull()
  })
})
