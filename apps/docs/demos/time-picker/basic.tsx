import { useState } from 'react'

import { TimePicker } from '@fish-admin/react'

export default function TimePickerBasic() {
  const [value, setValue] = useState<string | undefined>('09:00')

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Daily standup start
      </p>
      <TimePicker
        value={value}
        onChange={setValue}
        placeholder="Pick a time"
        ariaLabel="Standup start time"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted" aria-live="polite">
        {value ? `Standup begins at ${value} (24-hour HH:mm).` : 'No standup time set.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The popover holds two selects, HH and MM. Changing either calls <code>onChange</code>{' '}
        immediately; <code>Clear</code> in the footer resets to an empty value.
      </p>
    </div>
  )
}
