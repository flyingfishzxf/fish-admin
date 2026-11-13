import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Collapsible from './Collapsible.vue'

describe('Collapsible', () => {
  it('starts collapsed and expands on the trigger', async () => {
    const wrapper = mount(Collapsible, {
      props: { title: 'Advanced data retention', description: 'How long data is kept.' },
      slots: { default: '<p>Audit log 90 days</p>' },
    })

    const trigger = wrapper.get('button')
    expect(trigger.attributes('aria-expanded')).toBe('false')

    await trigger.trigger('click')

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Audit log 90 days')
  })

  it('renders the description next to the title', () => {
    const wrapper = mount(Collapsible, {
      props: { title: 'Advanced data retention', description: 'How long data is kept.' },
    })

    expect(wrapper.text()).toContain('Advanced data retention')
    expect(wrapper.text()).toContain('How long data is kept.')
  })
})
