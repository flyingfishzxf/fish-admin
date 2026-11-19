import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Rate from './Rate.vue'

describe('Rate', () => {
  it('renders a static radiogroup in read-only mode', () => {
    const wrapper = mount(Rate, { props: { value: 3, max: 5, readOnly: true } })

    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(5)
    expect(radios[2]!.attributes('aria-checked')).toBe('true')
    expect(radios.every((radio) => radio.attributes('disabled') !== undefined)).toBe(true)
  })

  it('fills up to the hovered star and emits on click', async () => {
    const wrapper = mount(Rate, { props: { value: 2, max: 5 } })

    const radios = wrapper.findAll('[role="radio"]')
    await radios[3]!.trigger('mouseenter')
    expect(radios[3]!.classes()).toContain('text-warning')
    await radios[3]!.trigger('click')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([4])
  })

  it('clears a repeated click when allowClear is set', async () => {
    const wrapper = mount(Rate, { props: { value: 3, max: 5 } })

    const radios = wrapper.findAll('[role="radio"]')
    await radios[2]!.trigger('click')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([0])
  })
})
