import type { Department } from '@fish-admin/contracts'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import DepartmentTree from './DepartmentTree.vue'

function dept(id: string, name: string, parentId: string | null = null): Department {
  return {
    id,
    name,
    parentId,
    directMemberCount: 2,
    memberCount: 4,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

const items = [
  dept('eng', 'Engineering'),
  dept('web', 'Web', 'eng'),
  dept('ops', 'Operations', 'eng'),
  dept('sales', 'Sales'),
]

function mountTree(overrides: Record<string, unknown> = {}) {
  return mount(DepartmentTree, {
    // DOM focus only sets `document.activeElement` when the tree is attached.
    attachTo: document.body,
    props: {
      items,
      modelValue: 'eng',
      label: 'Department tree',
      emptyLabel: 'No departments yet.',
      ...overrides,
    },
  })
}

function press(wrapper: ReturnType<typeof mountTree>, id: string, key: string) {
  wrapper
    .get(`[data-dept-id="${id}"]`)
    .element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  return nextTick()
}

describe('DepartmentTree', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a flat tree with levels, selection and expansion', () => {
    const wrapper = mountTree()

    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4)
    expect(wrapper.get('[role="tree"]').attributes('aria-label')).toBe('Department tree')
    expect(wrapper.get('[data-dept-id="eng"]').attributes('aria-level')).toBe('1')
    expect(wrapper.get('[data-dept-id="web"]').attributes('aria-level')).toBe('2')
    expect(wrapper.get('[data-dept-id="eng"]').attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-dept-id="web"]').attributes('aria-expanded')).toBeUndefined()
    expect(wrapper.get('[data-dept-id="eng"]').attributes('aria-selected')).toBe('true')
  })

  it('shows the empty label instead of an empty tree', () => {
    const wrapper = mountTree({ items: [], modelValue: null })

    expect(wrapper.find('[role="tree"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('No departments yet.')
  })

  it('emits the clicked id', async () => {
    const wrapper = mountTree()
    await wrapper.get('[data-dept-id="sales"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['sales']])
  })

  it('moves selection with arrow keys', async () => {
    const wrapper = mountTree()

    await press(wrapper, 'eng', 'ArrowDown')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['web'])
    // Real DOM focus must move with the selection, not just the tabindex.
    expect(document.activeElement?.getAttribute('data-dept-id')).toBe('web')
    await press(wrapper, 'web', 'ArrowUp')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['eng'])
    expect(document.activeElement?.getAttribute('data-dept-id')).toBe('eng')
    await press(wrapper, 'eng', 'End')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['sales'])
  })

  it('moves into an expanded branch, back to its parent and selects with Enter', async () => {
    const wrapper = mountTree()

    await press(wrapper, 'eng', 'ArrowRight')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['web'])
    await press(wrapper, 'web', 'ArrowLeft')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['eng'])
    await press(wrapper, 'eng', 'Home')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['eng'])
    await press(wrapper, 'eng', 'Enter')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['eng'])
  })

  it('collapses and expands branches with arrow keys', async () => {
    const wrapper = mountTree()

    await press(wrapper, 'eng', 'ArrowLeft')
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    expect(wrapper.get('[data-dept-id="eng"]').attributes('aria-expanded')).toBe('false')

    await press(wrapper, 'eng', 'ArrowRight')
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(4)
    expect(wrapper.get('[data-dept-id="eng"]').attributes('aria-expanded')).toBe('true')
  })

  it('keeps DOM focus after collapsing a branch holding the focused node', async () => {
    const wrapper = mountTree({ modelValue: 'web' })
    ;(wrapper.get('[data-dept-id="web"]').element as HTMLElement).focus()
    expect(document.activeElement?.getAttribute('data-dept-id')).toBe('web')

    // The disclosure control is the first span inside the Engineering row.
    await wrapper.get('[data-dept-id="eng"]').find('span').trigger('click')
    expect(wrapper.findAll('[role="treeitem"]')).toHaveLength(2)
    expect(wrapper.get('[data-dept-id="eng"]').attributes('tabindex')).toBe('0')
    expect(document.activeElement?.getAttribute('data-dept-id')).toBe('eng')

    await press(wrapper, 'eng', 'ArrowDown')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['sales'])
  })

  it('keeps a record whose parent is missing visible as a root', () => {
    const wrapper = mountTree({
      items: [dept('ghost', 'Ghost', 'missing'), dept('root', 'Root')],
    })

    expect(wrapper.get('[data-dept-id="ghost"]').attributes('aria-level')).toBe('1')
  })
})
