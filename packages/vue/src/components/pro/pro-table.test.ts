import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BulkActionsBar from './BulkActionsBar.vue'

describe('BulkActionsBar', () => {
  it('names its region and emits clear', async () => {
    const wrapper = mount(BulkActionsBar, {
      props: { label: '2 rows selected', clearLabel: 'Clear selection' },
      slots: { default: '<button type="button">Archive</button>' },
    })

    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('2 rows selected')

    await wrapper.get('button[aria-label="Clear selection"]').trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
