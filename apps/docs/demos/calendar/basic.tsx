import { useEffect, useState } from 'react'

import { Calendar, Card, CardContent } from '@fish-admin/react'

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

export default function CalendarBasic() {
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Seed after mount so the statically rendered page and the hydrated page agree.
  useEffect(() => {
    setDate(new Date())
  }, [])

  return (
    <div className="fish-demo-stack">
      {/* Same composition as the template: Card > CardContent > Calendar. */}
      <Card className="w-fit">
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            labels={{ labelNav: () => 'Access review calendar navigation' }}
          />
        </CardContent>
      </Card>
      <p className="fish-demo-muted" aria-live="polite">
        {date
          ? `Next access review: ${DATE_FORMAT.format(date)}`
          : 'Pick a date to schedule the review.'}
      </p>
    </div>
  )
}
