import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useDocumentTitle } from '@/lib/document-title'
import type { DashboardRange } from '@/types'

import { ActivityList } from './activity-list'
import { KpiCards, KpiCardsSkeleton } from './kpi-cards'
import { useDashboardQuery } from '../queries'

const RevenueChart = lazy(() =>
  import('./charts').then((module) => ({ default: module.RevenueChart })),
)
const ChannelsChart = lazy(() =>
  import('./charts').then((module) => ({ default: module.ChannelsChart })),
)
const TrafficChart = lazy(() =>
  import('./charts').then((module) => ({ default: module.TrafficChart })),
)

export function DashboardPage({
  range,
  onRangeChange,
}: {
  range: DashboardRange
  onRangeChange: (range: DashboardRange) => void
}) {
  const { t } = useTranslation('dashboard')
  const query = useDashboardQuery(range)
  useDocumentTitle(t('title'))

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        actions={
          <ToggleGroup
            type="single"
            value={String(range)}
            onValueChange={(value) => {
              if (value) onRangeChange(Number(value) as DashboardRange)
            }}
            variant="outline"
            size="sm"
            className="bg-card"
          >
            <ToggleGroupItem value="7" className="px-3 text-xs">
              {t('range.7')}
            </ToggleGroupItem>
            <ToggleGroupItem value="30" className="px-3 text-xs">
              {t('range.30')}
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />

      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <ErrorState
          title={t('errors.title')}
          description={t('errors.description')}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <KpiCards kpis={query.data.kpis} />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="shadow-soft lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('charts.revenue.title')}</CardTitle>
                <CardDescription>{t('charts.revenue.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[280px] w-full rounded-xl" />}>
                  <RevenueChart data={query.data.revenue} />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>{t('charts.channels.title')}</CardTitle>
                <CardDescription>{t('charts.channels.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
                  <ChannelsChart data={query.data.channels} />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="shadow-soft lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('charts.traffic.title')}</CardTitle>
                <CardDescription>{t('charts.traffic.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[280px] w-full rounded-xl" />}>
                  <TrafficChart data={query.data.traffic} />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>{t('charts.activity.title')}</CardTitle>
                <CardDescription>{t('charts.activity.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityList items={query.data.activity} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <KpiCardsSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-soft lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
