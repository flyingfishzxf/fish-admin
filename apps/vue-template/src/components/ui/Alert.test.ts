import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Alert from './Alert.vue'

describe('Alert', () => {
  it('renders as a live alert region with its title and description', () => {
    const wrapper = mount(Alert, {
      props: { title: 'Demo mode', variant: 'default' },
      slots: { default: 'Deliveries are simulated locally.' },
    })

    const alert = wrapper.get('[role="alert"]')
    expect(alert.attributes('data-variant')).toBe('default')
    expect(alert.text()).toContain('Demo mode')
    expect(alert.text()).toContain('Deliveries are simulated locally.')
  })

  it('marks destructive alerts with the destructive palette', () => {
    const wrapper = mount(Alert, {
      props: { variant: 'destructive' },
      slots: { default: 'Something went wrong.' },
    })

    const alert = wrapper.get('[role="alert"]')
    expect(alert.classes()).toContain('text-destructive')
    expect(alert.get('[data-slot="alert-description"]').classes()).toContain('text-destructive')
  })

  it('renders without a title block when no title is given', () => {
    const wrapper = mount(Alert, { slots: { default: 'Plain notice' } })

    expect(wrapper.find('[data-slot="alert-title"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Plain notice')
  })
})
