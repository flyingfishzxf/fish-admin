import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import QueryFilter from './QueryFilter.vue'
import type { FilterField, FilterValue } from '../../lib/query-filter-types'

const fields: FilterField[] = [
  { type: 'text', name: 'search', label: 'Search', placeholder: 'Name…' },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    allLabel: 'All',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  { type: 'boolean', name: 'verified', label: 'Verified' },
  { type: 'dateRange', fromName: 'from', toName: 'to', label: 'Period' },
]

const labels = { reset: 'Reset', more: 'More', less: 'Less' }

describe('QueryFilter', () => {
  it('shows only maxVisible fields until expanded', async () => {
    const wrapper = mount(QueryFilter, {
      props: { fields, value: {}, labels, maxVisible: 2 },
    })

    expect(wrapper.findAll('[data-slot="query-filter-field"]')).toHaveLength(2)
    const more = wrapper.findAll('button').find((button) => button.text() === 'More')!
    await more.trigger('click')
    expect(wrapper.findAll('[data-slot="query-filter-field"]')).toHaveLength(4)
  })

  it('emits the whole value object when text changes', async () => {
    const wrapper = mount(QueryFilter, { props: { fields, value: {}, labels, maxVisible: 4 } })

    const input = wrapper.find('input')
    await input.setValue('alice')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{ search: 'alice' }])
  })

  it('offers reset once a filter is active', async () => {
    const wrapper = mount(QueryFilter, {
      props: { fields, value: { status: 'active' }, labels, maxVisible: 4 },
    })

    const reset = wrapper.findAll('button').find((button) => button.text() === 'Reset')!
    await reset.trigger('click')
    expect(wrapper.emitted('change')?.at(-1)).toEqual([{} as FilterValue])
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
