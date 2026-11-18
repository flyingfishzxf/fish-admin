import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AutoComplete from './AutoComplete.vue'
import type { AutoCompleteOption } from './AutoComplete.vue'

const options: AutoCompleteOption[] = [
  { value: 'apple', label: 'Apple', description: 'Fruit' },
  { value: 'banana', label: 'Banana' },
]

describe('AutoComplete', () => {
  it('writes the query back and filters suggestions', async () => {
    const wrapper = mount(AutoComplete, {
      props: { options, value: '', ariaLabel: 'Fruit search' },
    })

    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.setValue('ban')
    expect(wrapper.emitted('update:value')?.at(-1)).toEqual(['ban'])
    // The component filters on the controlled value prop, so mirror the query.
    await wrapper.setProps({ value: 'ban' })

    const list = wrapper.find('[role="listbox"]')
    expect(list.exists()).toBe(true)
    expect(list.text()).toContain('Banana')
    expect(list.text()).not.toContain('Apple')
  })

  it('picks the highlighted option with Enter', async () => {
    const wrapper = mount(AutoComplete, {
      props: { options, value: '', ariaLabel: 'Fruit search' },
    })

    const input = wrapper.find('input')
    await input.trigger('focus')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:value')?.at(-1)).toEqual(['Apple'])
    const picked = wrapper.emitted('select')?.at(-1)?.[0] as AutoCompleteOption
    expect(picked.value).toBe('apple')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('shows the loading row instead of options', async () => {
    const wrapper = mount(AutoComplete, {
      props: {
        options,
        value: '',
        ariaLabel: 'Fruit search',
        loading: true,
        loadingLabel: 'Loading…',
      },
    })

    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('[role="listbox"]').text()).toContain('Loading…')
  })
})
