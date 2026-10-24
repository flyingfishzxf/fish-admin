import { TrendingDown, TrendingUp, UserPlus, Users, Target, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardKpi } from '@/types'

const KPI_META = {
  revenue: {
    icon: Wallet,
    tile: 'bg-chart-1/12 text-chart-1-foreground',
    format: 'currency',
  },
  activeUsers: {
    icon: Users,
    tile: 'bg-chart-2/14 text-chart-2-foreground',
    format: 'number',
  },
  signups: {
    icon: UserPlus,
    tile: 'bg-chart-3/14 text-chart-3-foreground',
    format: 'number',
  },
  conversion: {
    icon: Target,
    tile: 'bg-chart-4/16 text-chart-4-foreground',
    format: 'percent',
  },
} as const

function formatValue(kpi: DashboardKpi, language: string) {
  const format = KPI_META[kpi.id].format
  if (format === 'currency') return formatCurrency(kpi.value, language)
  if (format === 'percent') return formatPercent(kpi.value, language)
  return formatNumber(kpi.value, language)
}

export function KpiCards({ kpis }: { kpis: DashboardKpi[] }) {
  const { t, i18n } = useTranslation('dashboard')

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const meta = KPI_META[kpi.id]
        const Icon = meta.icon
        const positive = kpi.change >= 0

        return (
          <Card key={kpi.id} className="shadow-soft overflow-hidden">
            <CardContent className="relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t(`kpis.${kpi.id}`)}</p>
                  <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">
                    {formatValue(kpi, i18n.language)}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl',
                    meta.tile,
                  )}
                >
                  <Icon className="size-5" />
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
                    positive ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive',
                  )}
                >
                  {positive ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {positive ? '+' : ''}
                  {formatPercent(kpi.change, i18n.language)}
                </span>
                <span className="text-muted-foreground">{t('common:units.vsPrevious')}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="shadow-soft">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
