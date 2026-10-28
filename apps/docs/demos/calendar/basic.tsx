import { useEffect, useState } from 'react'

import { Calendar } from '@fish-admin/react'

const CALENDAR_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  background: 'var(--card)',
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export default function CalendarBasic() {
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Seed after mount so the statically rendered page and the hydrated page agree.
  useEffect(() => {
    setDate(new Date())
  }, [])

  return (
    <div className="fish-demo-stack">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        labels={{ labelNav: () => 'Access review calendar navigation' }}
        style={CALENDAR_STYLE}
      />
      <p className="fish-demo-muted" aria-live="polite">
        {date
          ? `Next access review: ${DATE_FORMAT.format(date)}`
          : 'Pick a date to schedule the review.'}
      </p>
    </div>
  )
}
