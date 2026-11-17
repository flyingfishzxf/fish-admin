import { FileText } from 'lucide-vue-next'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import List, { type ListItem } from './List.vue'

const items: ListItem[] = [
  { id: 'a', title: 'Invoice', description: 'March cycle', meta: 'PDF', icon: FileText },
  { id: 'b', title: 'Contract', disabled: true },
]

describe('List', () => {
  it('renders rows with icon, description and meta', () => {
    const wrapper = mount(List, {
      props: { items, ariaLabel: 'Documents', emptyLabel: 'Nothing here' },
    })

    expect(wrapper.find('ul').attributes('aria-label')).toBe('Documents')
    expect(wrapper.text()).toContain('Invoice')
    expect(wrapper.text()).toContain('March cycle')
    expect(wrapper.text()).toContain('PDF')
  })

  it('renders the dashed empty state', () => {
    const wrapper = mount(List, {
      props: { items: [], ariaLabel: 'Documents', emptyLabel: 'Nothing here' },
    })
    expect(wrapper.find('[data-slot="list-empty"]').text()).toBe('Nothing here')
  })

  it('emits clicks through the row buttons and marks the selected one', async () => {
    const onItemClick = vi.fn()
    const wrapper = mount(List, {
      props: { items, ariaLabel: 'Documents', emptyLabel: '', onItemClick, selectedId: 'a' },
    })

    const buttons = wrapper.findAll('button')
    // Row b is disabled: its click is swallowed by the browser, so click row a.
    await buttons[0]!.trigger('click')
    expect(onItemClick).toHaveBeenCalledWith(items[0])
    expect(buttons[0]!.attributes('aria-current')).toBe('true')
    expect(buttons[1]!.attributes('disabled')).toBeDefined()
  })
})
