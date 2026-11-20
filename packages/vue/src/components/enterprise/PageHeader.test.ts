import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('renders the eyebrow, title and description', () => {
    const wrapper = mount(PageHeader, {
      props: {
        eyebrow: 'Projects',
        title: 'Apollo migration',
        description: 'Move the remaining v1 services behind the new gateway.',
      },
    })

    expect(wrapper.text()).toContain('Projects')
    expect(wrapper.text()).toContain('Apollo migration')
    expect(wrapper.text()).toContain('Move the remaining v1 services behind the new gateway.')
  })

  it('exposes the actions slot', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Apollo migration' },
      slots: { actions: '<button>New task</button>' },
    })

    expect(wrapper.text()).toContain('New task')
  })

  it('omits the eyebrow when absent', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Audit log' } })

    expect(wrapper.text()).not.toContain('Projects')
    expect(wrapper.text()).toContain('Audit log')
  })
})
