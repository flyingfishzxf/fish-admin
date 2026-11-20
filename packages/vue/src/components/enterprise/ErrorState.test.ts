import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ErrorState from './ErrorState.vue'

describe('ErrorState', () => {
  it('renders the given title and description with the warning tile', () => {
    const wrapper = mount(ErrorState, {
      props: {
        title: "Couldn't load the report",
        description: 'The reporting service timed out after 30 seconds.',
      },
    })

    expect(wrapper.text()).toContain("Couldn't load the report")
    expect(wrapper.text()).toContain('The reporting service timed out after 30 seconds.')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows the retry button only with an onRetry handler and invokes it', async () => {
    const onRetry = vi.fn()
    const wrapper = mount(ErrorState, {
      props: { title: 'Failed', onRetry },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Try again')
    await button.trigger('click')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('falls back to the localized copy without props', () => {
    const wrapper = mount(ErrorState)
    expect(wrapper.text()).toContain('Something went wrong')
  })
})
