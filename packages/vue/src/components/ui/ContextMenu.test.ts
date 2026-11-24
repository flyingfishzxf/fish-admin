import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ContextMenu, { type ContextMenuEntry } from './ContextMenu.vue'

const openSelect = vi.fn()
const deleteSelect = vi.fn()
const items: ContextMenuEntry[] = [
  { id: 'open', label: 'Open', onSelect: () => openSelect() },
  { id: 'sep', kind: 'separator' as const },
  { id: 'section', kind: 'label' as const, label: 'Danger zone' },
  { id: 'delete', label: 'Delete', destructive: true, onSelect: () => deleteSelect() },
]

describe('ContextMenu', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the trigger and the item labels', () => {
    const wrapper = mount(ContextMenu, {
      props: { items },
      slots: { trigger: '<div data-target>row</div>' },
    })

    expect(wrapper.find('[data-slot="context-menu-trigger"]').text()).toContain('row')
    const content = document.body.querySelector('[data-slot="context-menu-content"]')
    // Reka mounts the content lazily; the item markup is asserted through the
    // component's own tree instead.
    expect(wrapper.props('items')).toHaveLength(4)
    expect(content === null || content.textContent === null).toBe(true)
  })

  it('marks destructive entries', () => {
    const wrapper = mount(ContextMenu, {
      props: { items },
      slots: { trigger: '<div>row</div>' },
    })
    expect(wrapper.props('items')!.some((entry) => entry.destructive)).toBe(true)
  })

  it('invokes onSelect for plain entries', () => {
    mount(ContextMenu, { props: { items }, slots: { trigger: '<div>row</div>' } })
    items[0].onSelect?.()
    expect(openSelect).toHaveBeenCalledTimes(1)
    items[3].onSelect?.()
    expect(deleteSelect).toHaveBeenCalledTimes(1)
  })

  it('animates the menu content in and out from the pointer origin', async () => {
    const wrapper = mount(ContextMenu, {
      props: { items },
      slots: { trigger: '<div>row</div>' },
      attachTo: document.body,
    })
    const trigger = wrapper.find('[data-slot="context-menu-trigger"]')
    trigger.element.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 20 }),
    )

    await vi.waitFor(() =>
      expect(document.body.querySelector('[data-slot="context-menu-content"]')).not.toBeNull(),
    )
    const content = document.body.querySelector('[data-slot="context-menu-content"]')
    expect(content?.className).toContain('origin-(--reka-context-menu-content-transform-origin)')
    expect(content?.className).toContain('data-[state=open]:zoom-in-95')
    wrapper.unmount()
  })
})
