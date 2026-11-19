import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import NotificationCenter from './NotificationCenter.vue'

const items = [
  { id: 'a', title: 'Mention', description: 'In #general', time: '2m', read: false },
  { id: 'b', title: 'Upload', description: 'report.pdf', time: '1h', read: true },
]

describe('NotificationCenter', () => {
  it('announces the derived unread count on the bell', () => {
    const wrapper = mount(NotificationCenter, { props: { items } })
    expect(wrapper.find('[data-slot="notification-center"]').attributes('aria-label')).toBe(
      'Notifications, 1 unread',
    )
    expect(wrapper.text()).toContain('1')
  })

  it('opens the panel with rows and a mark-all action', async () => {
    const onMarkAllRead = vi.fn(() => {})
    const wrapper = mount(NotificationCenter, {
      props: { items },
      attrs: { onMarkAllRead },
    })

    await wrapper.find('[data-slot="notification-center"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Mention')
    expect(document.body.textContent).toContain('In #general')
    expect(document.body.textContent).toContain('Mark all read')
  })

  it('shows the caught-up line for an empty list', async () => {
    const wrapper = mount(NotificationCenter, { props: { items: [] } })
    await wrapper.find('[data-slot="notification-center"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain("You're all caught up.")
  })
})
