import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import Select from './Select.vue'
import SelectTrigger from './SelectTrigger.vue'
import SelectValue from './SelectValue.vue'

describe('Select', () => {
  it('renders an explicit label without mounting the listbox', () => {
    const wrapper = mount(SelectValue, { props: { label: 'Admin' } })

    expect(wrapper.attributes('data-slot')).toBe('select-value')
    expect(wrapper.text()).toBe('Admin')
  })

  it('falls back to the placeholder', () => {
    const wrapper = mount(SelectValue, { props: { placeholder: 'Choose a role' } })

    expect(wrapper.text()).toBe('Choose a role')
  })

  it('renders the trigger as a combobox with its data-size and label', () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'admin' },
      slots: {
        default: () =>
          h(
            SelectTrigger,
            { 'aria-label': 'Assign role' },
            { default: () => h(SelectValue, { label: 'Admin' }) },
          ),
      },
    })

    const trigger = wrapper.get('[role="combobox"]')
    expect(trigger.attributes('data-size')).toBe('default')
    expect(trigger.text()).toContain('Admin')
  })
})
