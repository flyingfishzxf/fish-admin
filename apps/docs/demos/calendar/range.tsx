import { useEffect, useState } from 'react'

import { Button, Calendar } from '@fish-admin/react'

const CALENDAR_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  background: 'var(--card)',
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

type PreviewRange = { from: Date | undefined; to?: Date | undefined }

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export default function CalendarRange() {
  const [range, setRange] = useState<PreviewRange | undefined>(undefined)

  // Seed a three-night window after mount so server and client markup match.
  useEffect(() => {
    const from = new Date()
    setRange({ from, to: addDays(from, 3) })
  }, [])

  const nights =
    range?.from && range.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000))
      : 0

  return (
    <div className="fish-demo-stack">
      <Calendar
        mode="range"
        selected={range}
        onSelect={(next) => setRange(next)}
        labels={{ labelNav: () => 'Maintenance window calendar navigation' }}
        style={CALENDAR_STYLE}
      />
      <div className="fish-demo-row">
        <span className="fish-demo-muted" aria-live="polite">
          {range?.from
            ? `${DATE_FORMAT.format(range.from)} → ${
                range.to ? DATE_FORMAT.format(range.to) : 'pick an end date'
              }${nights > 0 ? ` (${nights} nights)` : ''}`
            : 'No maintenance window selected.'}
        </span>
        <Button variant="outline" size="sm" onClick={() => setRange(undefined)}>
          Clear
        </Button>
      </div>
    </div>
  )
}
