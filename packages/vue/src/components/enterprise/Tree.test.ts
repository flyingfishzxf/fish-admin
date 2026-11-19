import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Tree from './Tree.vue'
import type { TreeItem } from './Tree.vue'

const items: TreeItem[] = [
  { id: 'root', parentId: null, label: 'Workspace' },
  { id: 'team', parentId: 'root', label: 'Team', badge: '3' },
  { id: 'alice', parentId: 'team', label: 'Alice' },
  { id: 'orphan', parentId: null, label: 'Lone node' },
]

const base = { items, ariaLabel: 'Directory' }

describe('Tree', () => {
  it('renders roots with children expanded and honours selection', async () => {
    const wrapper = mount(Tree, {
      props: { ...base, selectedId: 'alice', onSelect: () => {} },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('[role="treeitem"]').map((row) => row.text())
    expect(rows).toContain('Workspace')
    expect(rows.some((text) => text.includes('Alice'))).toBe(true)

    const alice = wrapper.findAll('[role="treeitem"]').find((row) => row.text().includes('Alice'))!
    expect(alice.attributes('aria-selected')).toBe('true')
    expect(alice.attributes('aria-level')).toBe('3')
  })

  it('emits select on row click', async () => {
    const onSelect = vi.fn((id: string) => id)
    const wrapper = mount(Tree, {
      props: { ...base, selectedId: null, onSelect },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const root = wrapper.findAll('[role="treeitem"]')[0]!
    await root.trigger('click')
    expect(onSelect).toHaveBeenCalledWith('root')
  })

  it('collapses and expands a branch with its chevron', async () => {
    const wrapper = mount(Tree, {
      props: { ...base, selectedId: null, onSelect: () => {} },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const chevron = wrapper.find('[aria-label^="Collapse"]')
    await chevron.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[role="treeitem"]').some((row) => row.text().includes('Alice'))).toBe(
      false,
    )

    await wrapper.find('[aria-label^="Expand"]').trigger('click')
    await wrapper.vm.$nextTick()
    // Expanding the root reveals Team again; Alice stays folded until Team expands.
    expect(wrapper.findAll('[role="treeitem"]').some((row) => row.text().includes('Team'))).toBe(
      true,
    )
  })

  it('renders the empty state', () => {
    const wrapper = mount(Tree, { props: { ...base, items: [], emptyLabel: 'Nothing here' } })
    expect(wrapper.text()).toContain('Nothing here')
  })
})
