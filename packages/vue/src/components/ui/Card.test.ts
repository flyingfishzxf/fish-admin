import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Card from './Card.vue'

describe('Card', () => {
  it('renders title, description and default-slot content', () => {
    const wrapper = mount(Card, {
      props: { title: 'Deploy preview', description: 'Build 4812 passed.' },
      slots: { default: '<p>api · web · docs</p>' },
    })

    expect(wrapper.find('[data-slot="card-title"]').text()).toBe('Deploy preview')
    expect(wrapper.find('[data-slot="card-description"]').text()).toBe('Build 4812 passed.')
    expect(wrapper.find('[data-slot="card-content"]').text()).toContain('api · web · docs')
  })

  it('exposes header and footer slots', () => {
    const wrapper = mount(Card, {
      props: { title: 'Members' },
      slots: { header: '<button>Action</button>', footer: '<span>12 total</span>' },
    })

    expect(wrapper.find('[data-slot="card-header"]').text()).toContain('Action')
    const footer = wrapper.find('footer')
    expect(footer.exists()).toBe(true)
    expect(footer.text()).toContain('12 total')
  })

  it('hides the header when no title, description or header slot is given', () => {
    const wrapper = mount(Card, { slots: { default: '<p>plain</p>' } })

    expect(wrapper.find('[data-slot="card-header"]').exists()).toBe(false)
  })
})
