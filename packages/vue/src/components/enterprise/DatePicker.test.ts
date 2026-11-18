import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DatePicker from './DatePicker.vue'

describe('DatePicker', () => {
  it('renders the placeholder and the localized display value', () => {
    const empty = mount(DatePicker, { props: { placeholder: 'Pick a day', ariaLabel: 'Start' } })
    expect(empty.text()).toContain('Pick a day')

    const filled = mount(DatePicker, {
      props: { placeholder: 'Pick a day', ariaLabel: 'Start', value: '2026-03-14' },
    })
    expect(filled.text()).toContain('Mar 14, 2026')
  })

  it('opens the calendar and emits the picked day', async () => {
    const wrapper = mount(DatePicker, { props: { placeholder: 'Pick a day', ariaLabel: 'Start' } })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const cells = Array.from(
      document.body.querySelectorAll(
        '[data-slot="calendar-cell-trigger"], [data-reka-calendar-cell-trigger]',
      ),
    ).filter((cell) => cell.textContent === '15')
    const target = cells.at(-1) as HTMLElement
    target.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')).toBeDefined()
  })

  it('offers a clear button when a value is set', async () => {
    const wrapper = mount(DatePicker, {
      props: { placeholder: 'Pick a day', ariaLabel: 'Start', value: '2026-03-14' },
    })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const clear = Array.from(document.body.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Clear'),
    )!
    clear.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([undefined])
  })
})
