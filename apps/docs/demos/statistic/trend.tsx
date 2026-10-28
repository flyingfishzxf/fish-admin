import { Activity, Clock, ShieldCheck, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { Button, Statistic } from '@fish-admin/react'

const GRID = {
  display: 'grid',
  gap: '0.75rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
  width: '100%',
} as const

export default function StatisticTrend() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 'none' }}>
      <div className="fish-demo-row">
        <Button size="sm" variant="outline" onClick={() => setLoading((value) => !value)}>
          {loading ? 'Show the value' : 'Preview the loading state'}
        </Button>
        <span className="fish-demo-muted">
          Loading replaces the number with two skeletons and sets aria-busy on the card.
        </span>
      </div>
      <div style={GRID}>
        <Statistic
          label="Monthly recurring revenue"
          value={48250}
          prefix="$"
          loading={loading}
          trend={{ value: 12.4, label: 'vs last month' }}
          icon={TrendingUp}
        />
        <Statistic
          label="Open incidents"
          value={3}
          trend={{ value: 0, label: 'vs last week' }}
          icon={Activity}
        />
        <Statistic label="Uptime, last 30 days" value="99.98%" icon={ShieldCheck} />
        <Statistic
          label="Median first reply"
          value={2.35}
          precision={1}
          suffix="h"
          trend={{ value: -8.1, label: 'vs last month' }}
          icon={Clock}
        />
      </div>
      <p className="fish-demo-muted">
        The uptime card passes a string, so number formatting is skipped; the others go through
        Intl.NumberFormat and keep their sign in the trend label.
      </p>
    </div>
  )
}
