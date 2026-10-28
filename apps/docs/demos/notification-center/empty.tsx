import { useState } from 'react'

import { NotificationCenter, type NotificationItem } from '@fish-admin/react'
import { CheckCircle2 } from 'lucide-react'

const READ_ITEMS: NotificationItem[] = [
  {
    id: 'sync',
    title: 'Directory sync finished',
    description: '1,204 accounts reviewed, 3 deactivated.',
    time: 'Monday',
    icon: CheckCircle2,
    read: true,
  },
  {
    id: 'keys',
    title: 'API keys rotated',
    description: 'The CI deploy key was replaced at 09:14.',
    time: 'Last week',
    icon: CheckCircle2,
    read: true,
  },
]

export default function NotificationCenterEmpty() {
  const [status, setStatus] = useState('Pick a bell to inspect its panel.')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.375rem', justifyItems: 'start' }}>
          <span className="fish-demo-label">Empty inbox</span>
          <NotificationCenter
            items={[]}
            ariaLabel="Support inbox"
            title="Support inbox"
            markAllLabel="Mark all read"
            emptyLabel="No support notifications yet."
            onMarkAllRead={() => setStatus('Nothing to mark — the support inbox is empty.')}
            onViewAll={() => setStatus('View all — open the support inbox.')}
            viewAllLabel="Open support inbox"
          />
        </div>
        <div style={{ display: 'grid', gap: '0.375rem', justifyItems: 'start' }}>
          <span className="fish-demo-label">Everything read</span>
          <NotificationCenter
            items={READ_ITEMS}
            ariaLabel="Release inbox"
            title="Release inbox"
            markAllLabel="Mark all read"
            emptyLabel="No release notifications yet."
            onMarkAllRead={() => setStatus('All release notifications are already read.')}
          />
        </div>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {status}
      </p>
      <p className="fish-demo-muted">
        With no unread items the badge disappears and “Mark all read” is disabled.
      </p>
    </div>
  )
}
