import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Result from './Result.vue'

describe('Result', () => {
  it('announces an error outcome as alert and renders the extra slot', () => {
    const wrapper = mount(Result, {
      props: { status: 'error', title: 'Failed to save', description: 'Try again later.' },
      slots: { extra: '<button>Back</button>' },
    })

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Failed to save')
    expect(wrapper.find('button').text()).toBe('Back')
  })

  it('marks a success outcome as status without a description', () => {
    const wrapper = mount(Result, { props: { status: 'success', title: 'Saved' } })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('p').exists()).toBe(false)
  })
})
