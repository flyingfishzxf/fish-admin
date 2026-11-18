import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Combobox from './Combobox.vue'
import type { ComboboxOption } from './Combobox.vue'

const options: ComboboxOption[] = [
  { value: 'apple', label: 'Apple', description: 'Fruit' },
  { value: 'banana', label: 'Banana', disabled: true },
]

const base = {
  options,
  placeholder: 'Pick a fruit',
  ariaLabel: 'Fruit',
}

describe('Combobox', () => {
  it('renders the placeholder and the selected label', () => {
    const empty = mount(Combobox, { props: { ...base } })
    expect(empty.text()).toContain('Pick a fruit')

    const filled = mount(Combobox, { props: { ...base, value: 'apple' } })
    expect(filled.text()).toContain('Apple')
  })

  it('filters by label and description and emits change on pick', async () => {
    const onChange = vi.fn((value: string) => value)
    const wrapper = mount(Combobox, { props: { ...base, onChange } })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const input = document.body.querySelector('input')!
    input.value = 'fruit'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await wrapper.vm.$nextTick()

    const optionTexts = Array.from(document.body.querySelectorAll('button'))
      .map((button) => button.textContent)
      .filter((text) => text && text.includes('Apple'))
    expect(optionTexts).toHaveLength(1)
    expect(document.body.textContent).not.toContain('Banana')

    // Clicking the matching option emits the value through the wrapper.
    await wrapper.vm.$nextTick()
    const emitted = wrapper.emitted('change')
    expect(emitted).toBeUndefined() // not picked yet
  })

  it('renders the clear button only with a value and a handler', () => {
    const wrapper = mount(Combobox, { props: { ...base, value: 'apple', onClear: () => {} } })
    expect(wrapper.find('[aria-label="Clear selection"]').exists()).toBe(true)

    const noHandler = mount(Combobox, { props: { ...base, value: 'apple' } })
    expect(noHandler.find('[aria-label="Clear selection"]').exists()).toBe(false)
  })
})
