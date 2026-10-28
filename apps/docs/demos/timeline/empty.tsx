import { useState } from 'react'

import { Button, Timeline, type TimelineItem } from '@fish-admin/react'

const EVENTS: TimelineItem[] = [
  {
    id: 'created',
    title: 'Workflow submitted',
    description: 'Request WF-2026-0142 was opened by Katherine.',
    timestamp: 'Just now',
  },
  {
    id: 'review',
    title: 'Sent for review',
    description: 'Routed to the platform approvers group.',
    timestamp: '1 minute ago',
    tone: 'info',
  },
]

export default function TimelineEmpty() {
  const [items, setItems] = useState<TimelineItem[]>(EVENTS)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((current) => (current.length ? [] : EVENTS))}
        >
          {items.length ? 'Clear events' : 'Reload events'}
        </Button>
      </div>
      <Timeline items={items} emptyLabel="No audit events yet." />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        When <code>items</code> is empty the list collapses entirely. With an{' '}
        <code>emptyLabel</code> you get a muted placeholder line; without one, the component renders
        nothing.
      </p>
    </div>
  )
}
