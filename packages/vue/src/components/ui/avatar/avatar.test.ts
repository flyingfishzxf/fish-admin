import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Avatar from './Avatar.vue'
import AvatarFallback from './AvatarFallback.vue'
import AvatarImage from './AvatarImage.vue'

describe('Avatar', () => {
  it('writes the size preset to data-size', () => {
    const wrapper = mount(Avatar, { props: { size: 'sm' } })
    expect(wrapper.attributes('data-slot')).toBe('avatar')
    expect(wrapper.attributes('data-size')).toBe('sm')
    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('renders the fallback when no image is supplied', () => {
    const wrapper = mount(Avatar, {
      slots: { default: () => h(AvatarFallback, null, { default: () => 'AD' }) },
    })
    expect(wrapper.text()).toContain('AD')
    expect(wrapper.get('[data-slot="avatar-fallback"]').classes()).toContain('bg-muted')
  })

  it('falls back after the image fails to load', async () => {
    const wrapper = mount(Avatar, {
      slots: {
        default: () => [
          h(AvatarImage, { src: '/missing.png', alt: '' }),
          h(AvatarFallback, null, { default: () => 'AD' }),
        ],
      },
    })
    await wrapper.get('img').trigger('error')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('AD')
  })
})
