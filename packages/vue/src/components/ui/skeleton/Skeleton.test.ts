import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Skeleton from './Skeleton.vue'

describe('Skeleton', () => {
  it('renders a decorative pulse block', () => {
    const wrapper = mount(Skeleton, { props: { class: 'h-4 w-1/2' } })

    const node = wrapper.find('[data-slot="skeleton"]')
    expect(node.exists()).toBe(true)
    expect(node.classes()).toContain('animate-pulse')
    expect(node.attributes('aria-hidden')).toBe('true')
    expect(node.classes()).toContain('h-4')
    expect(node.classes()).toContain('w-1/2')
  })
})
