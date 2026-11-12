import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ListPageHeader from './ListPageHeader.vue'

describe('ListPageHeader', () => {
  it('renders the title, description, actions and toolbar', () => {
    const wrapper = mount(ListPageHeader, {
      props: { title: 'Roles', description: 'Manage roles' },
      slots: {
        actions: '<button>New role</button>',
        toolbar: '<input aria-label="Search roles" />',
      },
    })

    expect(wrapper.get('h1').text()).toBe('Roles')
    expect(wrapper.text()).toContain('Manage roles')
    expect(wrapper.get('button').text()).toBe('New role')
    expect(wrapper.find('input[aria-label="Search roles"]').exists()).toBe(true)
  })

  it('omits optional rows when no slots or description are given', () => {
    const wrapper = mount(ListPageHeader, { props: { title: 'Permissions' } })

    expect(wrapper.get('h1').text()).toBe('Permissions')
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(wrapper.findAll('input')).toHaveLength(0)
    expect(wrapper.findAll('p')).toHaveLength(0)
  })
})
