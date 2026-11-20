import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Calendar from './Calendar.vue'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
})

function mountCalendar(props: Record<string, unknown> = {}) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-02-20T12:00:00'))

  wrapper = mount(Calendar, {
    props: { modelValue: undefined, locale: 'en', ...props },
    attachTo: document.body,
  })
  return wrapper!
}

describe('Calendar', () => {
  it('paints the selected day primary', () => {
    const wrapper = mountCalendar({ modelValue: '2026-02-14' })

    const selected = wrapper.get('[data-value="2026-02-14"]')
    expect(selected.attributes('data-selected')).toBe('true')
    // the selected styling flows through Tailwind data-[selected] variants
    expect(selected.classes()).toEqual(
      expect.arrayContaining([
        'data-[selected]:bg-primary',
        'data-[selected]:text-primary-foreground',
      ]),
    )

    const neighbour = wrapper.get('[data-value="2026-02-15"]')
    expect(neighbour.attributes('data-selected')).toBeUndefined()
  })

  it('disables days outside the min and max window', () => {
    const wrapper = mountCalendar({ min: '2026-02-18', max: '2026-02-25' })

    const early = wrapper.get('[data-value="2026-02-10"]')
    expect(early.attributes('aria-disabled')).toBe('true')
    expect(early.attributes('data-disabled')).toBeDefined()

    const inWindow = wrapper.get('[data-value="2026-02-19"]')
    expect(inWindow.attributes('aria-disabled')).toBeUndefined()
    expect(inWindow.attributes('data-disabled')).toBeUndefined()
  })

  it('emits the picked day as a YYYY-MM-DD string', async () => {
    const wrapper = mountCalendar({ modelValue: undefined })

    await wrapper.get('[data-value="2026-02-14"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    expect(emitted!.at(-1)![0]).toBe('2026-02-14')
  })
})
