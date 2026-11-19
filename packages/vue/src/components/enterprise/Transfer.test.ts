import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Transfer from './Transfer.vue'
import type { TransferItem } from './Transfer.vue'

const items: TransferItem[] = [
  { key: 'a', label: 'Alpha' },
  { key: 'b', label: 'Beta', group: 'Pool B' },
  { key: 'c', label: 'Gamma', disabled: true },
]

const base = {
  items,
  sourceTitle: 'Available',
  targetTitle: 'Assigned',
}

describe('Transfer', () => {
  it('splits panels by value and shows the counts', () => {
    const wrapper = mount(Transfer, { props: { ...base, value: ['b'] } })

    const sections = wrapper.findAll('section')
    expect(sections[0]!.text()).toContain('Alpha')
    expect(sections[0]!.text()).not.toContain('Beta')
    expect(sections[1]!.text()).toContain('Beta')
    expect(sections[1]!.text()).toContain('Pool B')
  })

  it('toggles a row into the target on click', async () => {
    const wrapper = mount(Transfer, { props: { ...base, value: [] } })

    const alpha = sections0(wrapper).find((row) => row.text() === 'Alpha')!
    await alpha.trigger('click')
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([['a']])
  })

  it('selects all visible source rows with the header checkbox', async () => {
    const wrapper = mount(Transfer, { props: { ...base, value: [] } })

    // The package Checkbox renders a reka root button, not a native input.
    const checkboxes = wrapper.findAll('[role="checkbox"]')
    await checkboxes[0]!.trigger('click')
    // Gamma is disabled, so the header toggle picks Alpha and Beta only.
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([['a', 'b']])
  })
})

function sections0(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('section')[0]!.findAll('[role="option"]')
}
