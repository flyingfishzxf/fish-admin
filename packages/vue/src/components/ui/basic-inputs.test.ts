import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Progress from './Progress.vue'
import Toggle from './Toggle.vue'
import ToggleGroup from './ToggleGroup.vue'

describe('Progress', () => {
  it('renders the value and clamps the indicator transform', () => {
    const wrapper = mount(Progress, { props: { value: 30 } })
    expect(wrapper.find('[data-slot="progress"]').attributes('data-value')).toBe('30')
    expect(wrapper.find('[data-slot="progress-indicator"]').attributes('style')).toContain(
      'translateX(-70%)',
    )
  })
})

describe('Toggle', () => {
  it('toggles its own state when standalone', async () => {
    const wrapper = mount(Toggle, { slots: { default: () => 'Bold' } })
    expect(wrapper.find('[data-slot="toggle"]').attributes('aria-pressed')).toBe('false')
    await wrapper.trigger('click')
    expect(wrapper.find('[data-slot="toggle"]').attributes('data-state')).toBe('on')
  })

  it('joins a toggle group and selects a single value', async () => {
    const wrapper = mount(ToggleGroup, {
      props: { type: 'single' },
      slots: {
        default: () => [
          h(Toggle, { key: 'a', value: 'a' }, { default: () => 'A' }),
          h(Toggle, { key: 'b', value: 'b' }, { default: () => 'B' }),
        ],
      },
    })

    const buttons = wrapper.findAll('[data-slot="toggle"]')
    await buttons[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
  })

  it('supports multiple selection', async () => {
    const wrapper = mount(ToggleGroup, {
      props: { type: 'multiple', modelValue: ['a'] },
      slots: {
        default: () => [
          h(Toggle, { key: 'a', value: 'a' }, { default: () => 'A' }),
          h(Toggle, { key: 'b', value: 'b' }, { default: () => 'B' }),
        ],
      },
    })

    await wrapper.findAll('[data-slot="toggle"]')[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'b']])
  })
})

import { h } from 'vue'
