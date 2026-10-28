import { Trend } from '@fish-admin/react'

interface TrendRow {
  key: string
  name: string
  value: number
  label: string
  precision?: number
}

const ROWS: TrendRow[] = [
  { key: 'revenue', name: 'Monthly revenue', value: 12.4, label: 'vs last month' },
  { key: 'churn', name: 'Customer churn', value: -0.6, label: 'vs last month' },
  { key: 'active-users', name: 'Active users', value: 0, label: 'vs last week' },
  { key: 'latency', name: 'p95 latency', value: 8.02, label: 'vs last week', precision: 2 },
]

export default function TrendBasic() {
  return (
    <div className="fish-demo-stack">
      {ROWS.map((row) => (
        <div key={row.key} className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
          <span className="fish-demo-label">{row.name}</span>
          <Trend value={row.value} label={row.label} precision={row.precision ?? 1} />
        </div>
      ))}
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Positive values get <code>ArrowUpRight</code> in <code>text-success</code>, negative ones{' '}
        <code>ArrowDownRight</code> in <code>text-destructive</code>, and <code>0</code> a muted
        flat dash — the sign is always part of the text.
      </p>
    </div>
  )
}
