import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Pagination from './Pagination.vue'

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const wrapper = mount(Pagination, { props: { page: 1, pageCount: 1 } })

    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(false)
  })

  it('lists every page when the count is small', () => {
    const wrapper = mount(Pagination, { props: { page: 2, pageCount: 3 } })

    expect(wrapper.findAll('[data-page]').map((node) => node.text())).toEqual(['1', '2', '3'])
    expect(wrapper.get('[data-page="2"]').attributes('aria-current')).toBe('page')
    expect(wrapper.find('[data-page-ellipsis]').exists()).toBe(false)
  })

  it('collapses the middle once the count passes the window', () => {
    const wrapper = mount(Pagination, { props: { page: 10, pageCount: 20 } })

    expect(wrapper.findAll('[data-page]').map((node) => node.text())).toEqual([
      '1',
      '9',
      '10',
      '11',
      '20',
    ])
    expect(wrapper.findAll('[data-page-ellipsis]')).toHaveLength(2)
  })

  it('stops at both ends and emits the neighbouring page', async () => {
    const first = mount(Pagination, { props: { page: 1, pageCount: 3 } })
    expect(first.get('[data-page-action="prev"]').attributes('disabled')).toBeDefined()
    await first.get('[data-page-action="next"]').trigger('click')
    expect(first.emitted('update:page')).toEqual([[2]])

    const last = mount(Pagination, { props: { page: 3, pageCount: 3 } })
    expect(last.get('[data-page-action="next"]').attributes('disabled')).toBeDefined()
    await last.get('[data-page="1"]').trigger('click')
    expect(last.emitted('update:page')).toEqual([[1]])
  })

  it('treats an out-of-range page as the last one', () => {
    const wrapper = mount(Pagination, { props: { page: 9, pageCount: 3 } })

    expect(wrapper.get('[data-page="3"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-page-action="next"]').attributes('disabled')).toBeDefined()
  })
})
