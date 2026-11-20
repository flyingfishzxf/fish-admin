import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Avatar from './Avatar.vue'
import AvatarBadge from './AvatarBadge.vue'
import AvatarFallback from './AvatarFallback.vue'
import AvatarGroup from './AvatarGroup.vue'
import AvatarGroupCount from './AvatarGroupCount.vue'
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

  it('exposes the group and overflow-count slots', () => {
    const wrapper = mount(AvatarGroup, {
      slots: {
        default: () => [
          h(Avatar, null, { default: () => h(AvatarFallback, null, { default: () => 'AL' }) }),
          h(AvatarGroupCount, null, { default: () => '+5' }),
        ],
      },
    })
    expect(wrapper.attributes('data-slot')).toBe('avatar-group')
    // Overlap comes from the parent's child-selector class, not the child itself.
    expect(wrapper.classes()).toContain('*:data-[slot=avatar]:ring-2')
    expect(wrapper.get('[data-slot="avatar"]').exists()).toBe(true)
    const count = wrapper.get('[data-slot="avatar-group-count"]')
    expect(count.classes()).toContain('rounded-full')
    expect(count.text()).toBe('+5')
  })

  it('marks the badge as an image only with an accessible name', () => {
    const unnamed = mount(AvatarBadge)
    expect(unnamed.attributes('role')).toBeUndefined()

    const named = mount(AvatarBadge, { attrs: { 'aria-label': 'Online' } })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Online')
  })
})
