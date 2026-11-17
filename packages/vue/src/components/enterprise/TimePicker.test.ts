import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { minuteOptionsFor } from '../../lib/time-options'
import TimePicker from './TimePicker.vue'

describe('TimePicker', () => {
  it('renders the placeholder and the selected display value', () => {
    const empty = mount(TimePicker, {
      props: { placeholder: 'Pick a time', ariaLabel: 'Start' },
    })
    expect(empty.text()).toContain('Pick a time')

    const filled = mount(TimePicker, {
      props: { placeholder: 'Pick a time', ariaLabel: 'Start', value: '09:30' },
    })
    expect(filled.text()).toContain('09:30')
    expect(filled.text()).toContain('09')
    expect(filled.text()).toContain('30')
  })

  it('snaps minute options to the step and includes the current value', () => {
    expect(minuteOptionsFor(15, 33)).toEqual([0, 15, 30, 33, 45]) // 33 is off-grid but selected
    expect(minuteOptionsFor(5, 7)).toEqual([0, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
    expect(minuteOptionsFor(200, 2)).toEqual([0, 2, 59])
    expect(minuteOptionsFor(Number.NaN, undefined)).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
    ])
  })

  it('emits undefined on clear', async () => {
    const onChange = vi.fn()
    const wrapper = mount(TimePicker, {
      props: { placeholder: 'Pick', ariaLabel: 'Start', value: '09:30', onChange },
    })

    // Open the popover first: the footer buttons live in the body portal.
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const clear = Array.from(document.body.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Clear'),
    )
    expect(clear).toBeDefined()
    clear!.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(onChange).toHaveBeenCalledWith(undefined)
  })
})
