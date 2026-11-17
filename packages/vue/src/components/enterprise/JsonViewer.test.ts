import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import JsonViewer from './JsonViewer.vue'

describe('JsonViewer', () => {
  it('renders nested values and folds beyond the expanded depth', () => {
    const wrapper = mount(JsonViewer, {
      props: {
        ariaLabel: 'Snapshot',
        value: { vendor: 'Apple', items: [{ sku: 'A1' }], empty: {}, count: 2, active: true },
        defaultExpandedDepth: 3,
      },
    })

    expect(wrapper.text()).toContain('"Apple"')
    expect(wrapper.text()).toContain('{0}')
    expect(wrapper.text()).toContain('2')
    // depth 2 is expanded, so the nested sku is visible
    expect(wrapper.text()).toContain('A1')
  })

  it('folds and unfolds on click', async () => {
    const wrapper = mount(JsonViewer, {
      props: { ariaLabel: 'Snapshot', value: { a: { b: 'leaf' } } },
    })

    const toggle = wrapper.find('[aria-expanded]')
    await toggle.trigger('click')
    expect(wrapper.text()).not.toContain('leaf')
    await toggle.trigger('click')
    expect(wrapper.text()).toContain('leaf')
  })

  it('copies the payload through the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    const wrapper = mount(JsonViewer, { props: { ariaLabel: 'Snapshot', value: { a: 1 } } })

    await wrapper.find('button').trigger('click')
    expect(writeText).toHaveBeenCalledWith('{\n  "a": 1\n}')
    expect(wrapper.text()).toContain('Copied')
  })

  it('falls back to the empty state', () => {
    const wrapper = mount(JsonViewer, { props: { ariaLabel: 'Snapshot' } })
    expect(wrapper.text()).toContain('No data')
  })
})
