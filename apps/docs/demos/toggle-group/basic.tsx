import { useState } from 'react'

import { Columns3, Rows3 } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@fish-admin/react'

const LAYOUTS = [
  { value: 'rows', label: 'Rows', icon: Rows3 },
  { value: 'columns', label: 'Columns', icon: Columns3 },
] as const

const RECORDS = ['Aurora', 'Borealis', 'Cascade', 'Delta']

export default function ToggleGroupBasic() {
  const [layout, setLayout] = useState('rows')

  return (
    <div className="fish-demo-stack">
      <div style={{ width: 320 }}>
        <ToggleGroup
          type="single"
          variant="outline"
          value={layout}
          onValueChange={(value) => value && setLayout(value)}
          aria-label="Result layout"
        >
          {LAYOUTS.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value}>
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div
        style={{
          width: 320,
          display: 'grid',
          gap: '0.5rem',
          gridTemplateColumns: layout === 'columns' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
        }}
      >
        {RECORDS.map((record) => (
          <div
            key={record}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
            }}
          >
            {record}
          </div>
        ))}
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        {`type="single" keeps one value; spacing defaults to 0, so the two items join into one segmented control with rounded outer corners.`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
        {`Selected layout: ${layout}`}
      </p>
    </div>
  )
}
