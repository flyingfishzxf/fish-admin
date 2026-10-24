import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  NotificationCenter,
  type NotificationItem,
} from '@/components/enterprise/notification-center/notification-center'
import { changeLanguage, i18nReady } from '@/lib/i18n'

const items: NotificationItem[] = [
  { id: 'a', title: 'Invite accepted', time: '2 minutes ago' },
  { id: 'b', title: 'Deploy finished', time: '1 hour ago' },
]

describe('NotificationCenter', () => {
  beforeEach(async () => {
    await i18nReady
    await changeLanguage('en')
  })

  it('shows the unread count and marks every item as read', async () => {
    const user = userEvent.setup()
    const onMarkAllRead = vi.fn()
    render(
      <NotificationCenter
        items={items}
        ariaLabel="Notifications"
        title="Notifications"
        markAllLabel="Mark all as read"
        onMarkAllRead={onMarkAllRead}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Notifications, 2 unread' }))
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))

    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Invite accepted')).toBeInTheDocument()
  })

  it('notifies when an item is opened and disables mark-all when read', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()
    const readItems = items.map((item) => ({ ...item, read: true }))
    render(
      <NotificationCenter
        items={readItems}
        ariaLabel="Notifications"
        title="Notifications"
        markAllLabel="Mark all as read"
        onItemClick={onItemClick}
        onMarkAllRead={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Notifications' }))
    await user.click(screen.getByText('Deploy finished'))

    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
  })
})
