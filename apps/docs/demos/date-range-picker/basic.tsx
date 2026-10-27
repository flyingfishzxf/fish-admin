import { useState } from 'react'

import { DateRangePicker, type DateRangeValue } from '@fish-admin/react'

export default function DateRangePickerBasic() {
  const [value, setValue] = useState<DateRangeValue>({})
  return (
    <div className="fish-demo-stack">
      <DateRangePicker
        value={value}
        onChange={setValue}
        placeholder="Filter by date"
        ariaLabel="Report date range"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted">
        From {value.from ?? '—'} to {value.to ?? '—'}
      </p>
    </div>
  )
}
