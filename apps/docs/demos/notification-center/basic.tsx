import { useState } from 'react'

import { NotificationCenter, type NotificationItem } from '@fish-admin/react'
import { FileText, Rocket, UserPlus } from 'lucide-react'

const INITIAL_ITEMS: NotificationItem[] = [
  {
    id: 'invite',
    title: 'Invite accepted',
    description: 'Grace Hopper joined the Platform team.',
    time: '2 minutes ago',
    icon: UserPlus,
  },
  {
    id: 'deploy',
    title: 'Deploy to production finished',
    description: 'Build 4812 shipped in 42 seconds.',
    time: '1 hour ago',
    icon: Rocket,
  },
  {
    id: 'report',
    title: 'October usage report is ready',
    description: '240 seats active, 12 invitations pending.',
    time: 'Yesterday',
    icon: FileText,
    read: true,
  },
]

export default function NotificationCenterBasic() {
  const [items, setItems] = useState(INITIAL_ITEMS)
  const [status, setStatus] = useState('Inbox has 2 unread notifications.')

  const unread = items.filter((item) => !item.read).length

  return (
    <div className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
      <NotificationCenter
        items={items}
        ariaLabel="Notifications"
        title="Notifications"
        markAllLabel="Mark all read"
        emptyLabel="You're all caught up."
        viewAllLabel="View all notifications"
        onItemClick={(item) => {
          setItems((current) =>
            current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)),
          )
          setStatus(`Opened “${item.title}”.`)
        }}
        onMarkAllRead={() => {
          setItems((current) => current.map((entry) => ({ ...entry, read: true })))
          setStatus('All notifications marked read.')
        }}
        onViewAll={() => setStatus('View all — navigate to the notification inbox.')}
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0, maxWidth: '18rem' }}>
        {status} Unread badge now reports {unread}.
      </p>
    </div>
  )
}
