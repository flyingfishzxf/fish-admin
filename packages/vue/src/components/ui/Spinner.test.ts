import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Spinner from './Spinner.vue'
import LoadingOverlay from './LoadingOverlay.vue'

describe('Spinner', () => {
  it('is a status region when labelled and hidden otherwise', () => {
    const labelled = mount(Spinner, { props: { label: 'Loading users' } })
    expect(labelled.find('[role="status"]').attributes('aria-label')).toBe('Loading users')

    const bare = mount(Spinner)
    expect(bare.find('span').attributes('aria-hidden')).toBe('true')
  })

  it('sizes the icon', () => {
    const wrapper = mount(Spinner, { props: { size: 'lg' } })
    expect(wrapper.find('svg').classes()).toContain('size-6')
  })
})

describe('LoadingOverlay', () => {
  it('shows the overlay only while loading', async () => {
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true, label: 'Loading' },
      slots: { default: '<div>content</div>' },
    })

    expect(wrapper.find('[data-slot="loading-overlay-content"]').exists()).toBe(true)
    await wrapper.setProps({ loading: false })
    expect(wrapper.find('[data-slot="loading-overlay-content"]').exists()).toBe(false)
  })
})
