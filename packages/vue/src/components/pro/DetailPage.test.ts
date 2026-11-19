import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DetailPage from './DetailPage.vue'

describe('DetailPage', () => {
  it('renders the title, subtitle and slots', () => {
    const wrapper = mount(DetailPage, {
      props: { title: 'Alice', subtitle: 'alice@example.com' },
      slots: {
        back: '<a>Back</a>',
        actions: '<button>Edit</button>',
        default: '<p>Body</p>',
        footer: '<footer>Done</footer>',
      },
    })

    expect(wrapper.find('h1').text()).toBe('Alice')
    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.text()).toContain('Back')
    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).toContain('Body')
    expect(wrapper.text()).toContain('Done')
  })

  it('renders tabs instead of the body when tabs are given', () => {
    const wrapper = mount(DetailPage, {
      props: {
        title: 'Alice',
        tabs: [
          { value: 'info', label: 'Info', content: 'Profile details' },
          { value: 'logs', label: 'Logs', content: 'Audit trail' },
        ],
        tabsLabel: 'Sections',
      },
      slots: { default: '<p>Fallback</p>' },
    })

    expect(wrapper.text()).toContain('Info')
    expect(wrapper.text()).toContain('Logs')
    expect(wrapper.text()).toContain('Profile details')
    expect(wrapper.text()).not.toContain('Fallback')
  })
})
