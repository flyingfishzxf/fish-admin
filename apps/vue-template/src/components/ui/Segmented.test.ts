import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Segmented from './Segmented.vue'

const options = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mention', label: 'Mentions' },
]

describe('Segmented', () => {
  it('marks the active option as pressed', () => {
    const wrapper = mount(Segmented, {
      props: { options, modelValue: 'unread', ariaLabel: 'Filter' },
    })

    expect(wrapper.attributes('data-slot')).toBe('segmented')
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Filter')

    const pressed = wrapper.findAll('button').map((button) => button.attributes('aria-pressed'))
    expect(pressed).toEqual(['false', 'true', 'false'])
  })

  it('emits the value of the clicked option', async () => {
    const wrapper = mount(Segmented, { props: { options, modelValue: 'all' } })

    await wrapper.get('[data-segmented-option="mention"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['mention']])
  })

  it('sizes the text per option row', () => {
    const small = mount(Segmented, { props: { options, modelValue: 'all' } })
    const medium = mount(Segmented, { props: { options, modelValue: 'all', size: 'md' } })

    expect(small.get('button').classes()).toContain('text-xs')
    expect(medium.get('button').classes()).toContain('text-sm')
  })
})
