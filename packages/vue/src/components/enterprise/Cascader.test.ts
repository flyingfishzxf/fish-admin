import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Cascader from './Cascader.vue'
import type { CascaderOption } from './Cascader.vue'

const options: CascaderOption[] = [
  {
    value: 'cn',
    label: 'China',
    children: [
      { value: 'bj', label: 'Beijing' },
      { value: 'sh', label: 'Shanghai' },
    ],
  },
  { value: 'jp', label: 'Japan' },
]

const base = { options, placeholder: 'Pick a place', ariaLabel: 'Region' }

describe('Cascader', () => {
  it('renders the placeholder and the joined label', () => {
    const empty = mount(Cascader, { props: { ...base } })
    expect(empty.text()).toContain('Pick a place')

    const filled = mount(Cascader, { props: { ...base, value: ['cn', 'bj'] } })
    expect(filled.text()).toContain('China / Beijing')
  })

  it('drills into children and emits the full path on a leaf', async () => {
    const wrapper = mount(Cascader, { props: { ...base } })

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    const columns = document.body.querySelectorAll('ul')
    expect(columns.length).toBe(1)

    const china = Array.from(document.body.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('China'),
    )!
    china.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()

    // The child column appears and the leaf pick emits the full path.
    const shanghai = Array.from(document.body.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Shanghai'),
    )!
    shanghai.dispatchEvent(new Event('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('change')?.at(-1)).toEqual([['cn', 'sh']])
  })

  it('surfaces the clear affordance only with a value and a handler', () => {
    const wrapper = mount(Cascader, {
      props: { ...base, value: ['cn'] },
      attrs: { onClear: () => {} },
    })
    expect(wrapper.find('[aria-label="Clear selection"]').exists()).toBe(true)

    const noHandler = mount(Cascader, { props: { ...base, value: ['cn'] } })
    expect(noHandler.find('[aria-label="Clear selection"]').exists()).toBe(false)
  })
})
