import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import DateRangePicker from './DateRangePicker.vue'
import RangeCalendar from './RangeCalendar.vue'

const PRESETS = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
]

describe('DateRangePicker', () => {
  it('announces the placeholder and then the formatted range', async () => {
    const wrapper = mount(DateRangePicker, {
      props: {
        modelValue: {},
        placeholder: 'Filter by date',
        ariaLabel: 'Report date range',
      },
      attachTo: document.body,
    })

    const trigger = wrapper.get('button')
    expect(trigger.attributes('aria-label')).toBe('Report date range: Filter by date')
    expect(trigger.classes()).toContain('text-muted-foreground')

    await wrapper.setProps({ modelValue: { from: '2026-09-28', to: '2026-10-27' } })

    expect(trigger.attributes('aria-label')).toBe('Report date range: Sep 28, 2026 – Oct 27, 2026')
    expect(trigger.text()).toContain('Sep 28, 2026 – Oct 27, 2026')
    expect(trigger.classes()).not.toContain('text-muted-foreground')

    wrapper.unmount()
  })

  it('emits the preset range when a preset is chosen', async () => {
    const wrapper = mount(DateRangePicker, {
      props: {
        modelValue: {},
        placeholder: 'Filter by date',
        ariaLabel: 'Report date range',
        presets: PRESETS,
      },
      attachTo: document.body,
    })

    await wrapper.get('button').trigger('click')
    await nextTick()

    const preset = [...document.body.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Last 7 days',
    )
    expect(preset).toBeTruthy()
    preset?.click()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
      { from: '2026-10-21', to: '2026-10-27' },
    ])

    wrapper.unmount()
  })
})

describe('RangeCalendar', () => {
  it('paints only the endpoints primary and the days between them on the accent band', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-02-20T12:00:00'))

    try {
      const wrapper = mount(RangeCalendar, {
        props: { modelValue: { from: '2026-02-10', to: '2026-02-14' }, locale: 'en' },
        attachTo: document.body,
      })

      const cell = (iso: string) => wrapper.get(`[data-value="${iso}"]`)

      expect(cell('2026-02-10').classes()).toEqual(
        expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'rounded-s-md']),
      )
      expect(cell('2026-02-14').classes()).toEqual(
        expect.arrayContaining(['bg-primary', 'text-primary-foreground', 'rounded-e-md']),
      )
      expect(cell('2026-02-12').classes()).toEqual(
        expect.arrayContaining(['bg-accent', 'text-accent-foreground', 'rounded-none']),
      )
      expect(cell('2026-02-12').classes()).not.toContain('bg-primary')

      expect(cell('2026-02-09').classes()).not.toContain('bg-primary')
      expect(cell('2026-02-09').classes()).not.toContain('bg-accent')

      expect(wrapper.find('[aria-label="Go to previous month"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Go to next month"]').exists()).toBe(true)

      wrapper.unmount()
    } finally {
      vi.useRealTimers()
    }
  })
})
