import { useState } from 'react'

import { TimePicker } from '@fish-admin/react'

export default function TimePickerSteps() {
  const [value, setValue] = useState<string | undefined>('14:20')

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Maintenance window
      </p>
      <TimePicker
        value={value}
        onChange={setValue}
        minuteStep={15}
        placeholder="Pick a slot"
        ariaLabel="Maintenance window start"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted" aria-live="polite">
        {value ? `Maintenance starts at ${value}.` : 'No maintenance slot chosen.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        With <code>minuteStep</code> set to 15, the MM column lists 00, 15, 30 and 45. Because the
        stored value is 14:20, the component still injects 20 into the list so nothing is lost when
        the popover opens.
      </p>
    </div>
  )
}
