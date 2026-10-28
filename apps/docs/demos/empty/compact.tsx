import { useState } from 'react'

import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
} from '@fish-admin/react'
import { SearchX } from 'lucide-react'

const EVENTS = [
  { title: 'Ada invited you to Apollo migration', meta: '2 hours ago' },
  { title: 'Grace requested access to Q3 roadmap', meta: 'Yesterday' },
  { title: 'Alan exported the audit log', meta: '3 days ago' },
]

export default function EmptyCompact() {
  const [query, setQuery] = useState('')
  const matches = EVENTS.filter((event) =>
    event.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 460 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.625rem 0.75rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Activity</span>
          <Badge variant="secondary">{matches.length} events</Badge>
        </div>
        <div style={{ padding: '0.75rem' }}>
          <div style={{ width: '15rem', marginBottom: '0.75rem' }}>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter activity"
              aria-label="Filter activity"
            />
          </div>
          {matches.length === 0 ? (
            <Empty style={{ padding: '1.25rem', gap: '0.75rem' }}>
              <EmptyHeader style={{ gap: '0.25rem' }}>
                <EmptyMedia variant="icon">
                  <SearchX />
                </EmptyMedia>
                <EmptyTitle style={{ fontSize: '1rem' }}>No matching activity</EmptyTitle>
                <EmptyDescription>
                  Nothing matches “{query}”. Clear the filter to see all three events.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent style={{ gap: '0.5rem' }}>
                <Button variant="outline" size="xs" onClick={() => setQuery('')}>
                  Clear filter
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul
              style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}
            >
              {matches.map((event) => (
                <li key={event.title}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{event.title}</p>
                  <p className="fish-demo-muted" style={{ margin: 0 }}>
                    {event.meta}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="fish-demo-muted">
        The compact state overrides padding, gap and title size with inline styles; the panel
        supplies the border instead of the outline variant.
      </p>
    </div>
  )
}
