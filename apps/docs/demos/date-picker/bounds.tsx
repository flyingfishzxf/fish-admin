import { useState } from 'react'

import { DatePicker } from '@fish-admin/react'

const MIN = '2026-10-01'
const MAX = '2026-12-31'

export default function DatePickerBounds() {
  const [value, setValue] = useState<string | undefined>('2026-10-15')

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Access review date
      </p>
      <DatePicker
        value={value}
        onChange={setValue}
        min={MIN}
        max={MAX}
        placeholder="Pick a date in Q4"
        ariaLabel="Access review date"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted" aria-live="polite">
        {value ? `Review scheduled for ${value}.` : 'No review date selected.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>min</code> and <code>max</code> are inclusive: every day before {MIN} and after {MAX}
        is a disabled day in the calendar, and the picker still opens on the selected month.
      </p>
    </div>
  )
}
