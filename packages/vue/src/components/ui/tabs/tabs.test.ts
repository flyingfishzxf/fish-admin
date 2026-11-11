import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'

import Tabs from './Tabs.vue'
import TabsContent from './TabsContent.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'

function mountTabs(orientation: 'horizontal' | 'vertical' = 'horizontal') {
  return mount(Tabs, {
    props: { defaultValue: 'profile', orientation },
    slots: {
      default: () => [
        h(TabsList, null, {
          default: () => [
            h(TabsTrigger, { value: 'profile' }, { default: () => 'Profile' }),
            h(TabsTrigger, { value: 'notifications' }, { default: () => 'Notifications' }),
          ],
        }),
        h(TabsContent, { value: 'profile' }, { default: () => 'Profile panel' }),
        h(TabsContent, { value: 'notifications' }, { default: () => 'Notifications panel' }),
      ],
    },
  })
}

describe('Tabs', () => {
  it('activates the default tab and switches on click', async () => {
    const wrapper = mountTabs()
    await nextTick()

    const triggers = wrapper.findAll('[role="tab"]')
    expect(triggers).toHaveLength(2)
    expect(triggers[0].attributes('data-state')).toBe('active')
    expect(triggers[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('Profile panel')

    // Reka UI activates on the left mouse button, exactly like Radix, so mirror a real click.
    await triggers[1].trigger('mousedown', { button: 0 })
    await triggers[1].trigger('click')
    await nextTick()

    const nextTriggers = wrapper.findAll('[role="tab"]')
    expect(nextTriggers[1].attributes('data-state')).toBe('active')
    expect(nextTriggers[1].attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('Notifications panel')
  })

  it('exposes the vertical orientation', () => {
    const wrapper = mountTabs('vertical')
    expect(wrapper.attributes('data-orientation')).toBe('vertical')
  })
})
