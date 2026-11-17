import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Descriptions from './Descriptions.vue'

describe('Descriptions', () => {
  it('renders term/description pairs in source order', () => {
    const wrapper = mount(Descriptions, {
      props: {
        items: [
          { term: 'Vendor', description: 'Apple Business' },
          { term: 'Quantity', description: '2', span: 2 },
        ],
      },
    })

    const terms = wrapper.findAll('dt').map((node) => node.text())
    expect(terms).toEqual(['Vendor', 'Quantity'])
    expect(wrapper.find('dd').text()).toBe('Apple Business')
    expect(wrapper.findAll('div.min-w-0')[1]!.classes()).toContain('sm:col-span-2')
  })

  it('switches the column layout', () => {
    const wrapper = mount(Descriptions, { props: { items: [], columns: 3 } })
    expect(wrapper.find('dl').classes()).toContain('sm:grid-cols-3')
  })
})
