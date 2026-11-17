import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AnchorNav from './AnchorNav.vue'

describe('AnchorNav', () => {
  it('renders one button per section and marks the first active', () => {
    const wrapper = mount(AnchorNav, {
      props: {
        items: [
          { id: 'overview', label: 'Overview' },
          { id: 'budget', label: 'Budget' },
        ],
        ariaLabel: 'Sections',
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]!.attributes('aria-current')).toBe('location')
    expect(buttons[1]!.attributes('aria-current')).toBeUndefined()
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Sections')
  })

  it('activates the clicked section and scrolls to it', async () => {
    const section = document.createElement('div')
    section.id = 'budget'
    document.body.appendChild(section)

    const wrapper = mount(AnchorNav, {
      props: {
        items: [
          { id: 'overview', label: 'Overview' },
          { id: 'budget', label: 'Budget' },
        ],
        ariaLabel: 'Sections',
      },
    })

    await wrapper.findAll('button')[1]!.trigger('click')
    expect(wrapper.findAll('button')[1]!.attributes('aria-current')).toBe('location')
    section.remove()
  })
})
