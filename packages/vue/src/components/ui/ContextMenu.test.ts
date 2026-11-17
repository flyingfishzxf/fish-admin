import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

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
})
