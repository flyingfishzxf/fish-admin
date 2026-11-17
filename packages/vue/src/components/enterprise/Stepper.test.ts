import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Stepper from './Stepper.vue'

const steps = [
  { id: 'plan', title: 'Plan', description: 'Scope the work' },
  { id: 'build', title: 'Build' },
  { id: 'review', title: 'Review' },
]

describe('Stepper', () => {
  it('marks completed, current and upcoming steps', () => {
    const wrapper = mount(Stepper, { props: { steps, current: 1, ariaLabel: 'Progress' } })

    const items = wrapper.findAll('li')
    expect(items[0]!.find('svg').exists()).toBe(true)
    expect(items[1]!.attributes('aria-current')).toBe('step')
    expect(items[2]!.text()).toContain('Review')
    expect(items[0]!.text()).toContain('Scope the work')
  })

  it('makes completed steps clickable only when onStepClick is given', async () => {
    const onStepClick = vi.fn()
    const wrapper = mount(Stepper, {
      props: { steps, current: 1, ariaLabel: 'Progress', onStepClick },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    await buttons[0]!.trigger('click')
    expect(onStepClick).toHaveBeenCalledWith(0)

    const inert = mount(Stepper, { props: { steps, current: 1, ariaLabel: 'Progress' } })
    expect(inert.findAll('button')).toHaveLength(0)
  })
})
