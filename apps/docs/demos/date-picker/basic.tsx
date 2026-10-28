import { useState } from 'react'

import { DatePicker } from '@fish-admin/react'

export default function DatePickerBasic() {
  const [value, setValue] = useState<string | undefined>('2026-11-03')

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Migration window opens
      </p>
      <DatePicker
        value={value}
        onChange={setValue}
        placeholder="Pick a date"
        ariaLabel="Migration start date"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted" aria-live="polite">
        {value
          ? `Freeze deployments on ${value}. The value is a YYYY-MM-DD string, not a Date.`
          : 'No freeze date scheduled.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Choosing a day stores it and closes the popover; <code>Clear</code> in the footer calls
        <code> onChange(undefined)</code>.
      </p>
    </div>
  )
}
