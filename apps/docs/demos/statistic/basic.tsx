import { Activity, TrendingUp, Users } from 'lucide-react'

import { Statistic } from '@fish-admin/react'

const GRID = {
  display: 'grid',
  gap: '0.75rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
  width: '100%',
} as const

export default function StatisticBasic() {
  return (
    <div style={GRID}>
      <Statistic
        label="Revenue this month"
        value={128400}
        prefix="$"
        suffix="MRR"
        trend={{ value: 12.4, label: 'vs last month' }}
        icon={TrendingUp}
      />
      <Statistic label="Active members" value={2480} icon={Users} />
      <Statistic
        label="Churn rate"
        value={1.8}
        precision={1}
        suffix="%"
        trend={{ value: -0.6, label: 'vs last month' }}
        icon={Activity}
      />
    </div>
  )
}
