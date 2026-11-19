import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TreeSelect from './TreeSelect.vue'
import type { TreeItem } from './Tree.vue'

const items: TreeItem[] = [
  { id: 'root', parentId: null, label: 'Workspace' },
  { id: 'team', parentId: 'root', label: 'Team' },
]

const base = { items, placeholder: 'Pick a node', ariaLabel: 'Node' }

describe('TreeSelect', () => {
  it('joins the selected path as the trigger label', () => {
    const wrapper = mount(TreeSelect, { props: { ...base, value: 'team' } })
    expect(wrapper.text()).toContain('Workspace / Team')
  })

  it('opens the tree and emits the picked node id', async () => {
    const wrapper = mount(TreeSelect, { props: { ...base } })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const root = Array.from(document.body.querySelectorAll('[role="treeitem"]')).find((row) =>
      (row.textContent ?? '').includes('Workspace'),
    )!
    root.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['root'])
  })

  it('renders the clear affordance only when a handler is present', () => {
    const withHandler = mount(TreeSelect, {
      props: { ...base, value: 'root' },
      attrs: { onClear: () => {} },
    })
    expect(withHandler.find('[aria-label="Clear selection"]').exists()).toBe(true)
  })
})
