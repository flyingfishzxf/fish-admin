import { useState } from 'react'

import { DateRangePicker, type DateRangePreset, type DateRangeValue } from '@fish-admin/react'

const PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
  { label: 'This quarter', from: '2026-10-01', to: '2026-10-27' },
]

export default function DateRangePickerPresets() {
  const [value, setValue] = useState<DateRangeValue>({ from: '2026-09-28', to: '2026-10-27' })
  return (
    <div className="fish-demo-stack">
      <DateRangePicker
        value={value}
        onChange={setValue}
        placeholder="Select a range"
        ariaLabel="Audit log date range"
        presets={PRESETS}
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted">
        Selected {value.from ?? '—'} – {value.to ?? '—'}
      </p>
    </div>
  )
}
