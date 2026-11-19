import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Table from './Table.vue'
import TableBody from './TableBody.vue'
import TableCaption from './TableCaption.vue'
import TableCell from './TableCell.vue'
import TableHead from './TableHead.vue'
import TableHeader from './TableHeader.vue'
import TableRow from './TableRow.vue'

describe('table family', () => {
  it('wraps the table in a focusable scroll container by default', () => {
    const wrapper = mount(Table)
    expect(wrapper.find('[data-slot="table-container"]').attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-slot="table"]').exists()).toBe(true)
  })

  it('skips the container when requested', () => {
    const wrapper = mount(Table, { props: { container: false } })
    expect(wrapper.find('[data-slot="table-container"]').exists()).toBe(false)
    expect(wrapper.find('[data-slot="table"]').exists()).toBe(true)
  })

  it('renders the full table structure', () => {
    const wrapper = mount(Table, {
      slots: {
        default: () => [
          h(TableCaption, null, { default: () => 'Members' }),
          h(TableHeader, null, {
            default: () =>
              h(TableRow, null, { default: () => h(TableHead, null, { default: () => 'Name' }) }),
          }),
          h(TableBody, null, {
            default: () =>
              h(TableRow, null, { default: () => h(TableCell, null, { default: () => 'Alice' }) }),
          }),
        ],
      },
    })

    expect(wrapper.find('[data-slot="table-caption"]').text()).toBe('Members')
    expect(wrapper.find('[data-slot="table-head"]').text()).toBe('Name')
    expect(wrapper.find('[data-slot="table-cell"]').text()).toBe('Alice')
  })
})

import { h } from 'vue'
