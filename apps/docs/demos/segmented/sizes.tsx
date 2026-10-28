import { useState } from 'react'

import { Segmented } from '@fish-admin/react'
import { Archive, CalendarDays, CalendarRange, Columns3, LayoutGrid, List } from 'lucide-react'

export default function SegmentedSizes() {
  const [period, setPeriod] = useState('monthly')
  const [layout, setLayout] = useState('grid')

  return (
    <div className="fish-demo-stack">
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <span className="fish-demo-label">Default size</span>
        <Segmented
          aria-label="Billing period"
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: 'monthly', label: 'Monthly', icon: CalendarDays },
            { value: 'annual', label: 'Annual', icon: CalendarRange },
            { value: 'lifetime', label: 'Lifetime', icon: Archive, disabled: true },
          ]}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <span className="fish-demo-label">Small size</span>
        <Segmented
          aria-label="Report layout"
          size="sm"
          value={layout}
          onValueChange={setLayout}
          options={[
            { value: 'grid', label: 'Grid', icon: LayoutGrid },
            { value: 'list', label: 'List', icon: List },
            { value: 'board', label: 'Board', icon: Columns3, disabled: true },
          ]}
        />
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {period === 'monthly'
          ? 'Monthly billing renews on the 1st.'
          : 'Annual billing includes two months free.'}{' '}
        Layout: {layout}. Lifetime and board stay disabled until the plan changes.
      </p>
    </div>
  )
}
