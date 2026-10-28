import { useState } from 'react'

import { Button, ScrollArea } from '@fish-admin/react'

const EVENTS = [
  {
    id: 'e1',
    title: 'Report exported',
    detail: 'Q3 revenue by region · 1.2 MB CSV',
    time: '09:41',
  },
  { id: 'e2', title: 'Member invited', detail: 'new.teammate@acme.dev · Design', time: '09:12' },
  {
    id: 'e3',
    title: 'Webhook retried',
    detail: 'Endpoint billing-sync · attempt 2',
    time: '08:55',
  },
  {
    id: 'e4',
    title: 'API key rotated',
    detail: 'Production key · expires in 90 days',
    time: '08:20',
  },
  {
    id: 'e5',
    title: 'Plan changed',
    detail: 'Team → Business · prorated invoice',
    time: 'Yesterday',
  },
  {
    id: 'e6',
    title: 'Audit log purge',
    detail: 'Entries older than 180 days removed',
    time: 'Yesterday',
  },
  {
    id: 'e7',
    title: 'Backup completed',
    detail: 'eu-central-1 · 42 GB snapshot',
    time: '2 days ago',
  },
]

export default function ScrollAreaBasic() {
  const [unread, setUnread] = useState(['e1', 'e2', 'e3'])

  function markRead(id: string) {
    setUnread((previous) => previous.filter((entry) => entry !== id))
  }

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '30rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Workspace activity</p>
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            {unread.length === 0 ? 'All caught up' : `${unread.length} unread of ${EVENTS.length}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={unread.length === 0}
          onClick={() => setUnread([])}
        >
          Mark all read
        </Button>
      </div>
      <ScrollArea
        style={{ height: 200, border: '1px solid var(--border)', borderRadius: '0.5rem' }}
      >
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {EVENTS.map((event, index) => {
            const isUnread = unread.includes(event.id)
            return (
              <li
                key={event.id}
                style={{ borderTop: index === 0 ? 'none' : '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => markRead(event.id)}
                  style={{
                    display: 'grid',
                    gap: '0.125rem',
                    width: '100%',
                    padding: '0.5rem 1.25rem 0.5rem 0.75rem',
                    textAlign: 'left',
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6,
                        height: 6,
                        flexShrink: 0,
                        borderRadius: '999px',
                        background: isUnread ? 'var(--primary)' : 'transparent',
                        border: isUnread ? 'none' : '1px solid var(--border)',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: isUnread ? 600 : 400 }}>
                      {event.title}
                    </span>
                    <span
                      className="fish-demo-muted"
                      style={{ marginLeft: 'auto', fontSize: '0.7rem' }}
                    >
                      {event.time}
                    </span>
                  </span>
                  <span className="fish-demo-muted" style={{ paddingLeft: '0.875rem' }}>
                    {event.detail}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
      <p className="fish-demo-muted">
        Tab into the region, then scroll with the arrow keys, Page Up / Page Down or the wheel.
      </p>
    </div>
  )
}
