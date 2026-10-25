import {
  Banknote,
  CircleCheck,
  Download,
  Info,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { AnchorNav, type AnchorItem } from '@/components/enterprise/anchor-nav/anchor-nav'
import { BackTop } from '@/components/enterprise/back-top/back-top'
import { ColorPicker } from '@/components/ui/color-picker'
import {
  DateRangePicker,
  type DateRangePreset,
  type DateRangeValue,
} from '@/components/enterprise/date-range-picker/date-range-picker'
import { PageContainer } from '@/components/enterprise/page-container/page-container'
import { Statistic } from '@/components/enterprise/statistic/statistic'
import { Trend } from '@/components/enterprise/trend/trend'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputNumber } from '@/components/ui/input-number'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Segmented } from '@/components/ui/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDocumentTitle } from '@/lib/document-title'
import { formatCurrency } from '@/lib/format'
import { formatDayDisplay, formatDayValue } from '@/lib/date'
import type { ReportGranularity, ReportKpi, ReportRow } from '@/types'

import { downloadCsv } from '../csv'
import { useReportQuery } from '../queries'
import { resolveReportRange, type ReportsSearch } from '../search'
import type { ReportMetric } from './report-charts'

const ReportTrendChart = lazy(() =>
  import('./report-charts').then((module) => ({ default: module.ReportTrendChart })),
)
const ReportChannelsChart = lazy(() =>
  import('./report-charts').then((module) => ({ default: module.ReportChannelsChart })),
)

const PAGE_SIZE = 10
const TARGET_MIN = 1000
const TARGET_MAX = 20000
const TARGET_STEP = 100
const DEFAULT_TARGET = 5800
const DEFAULT_COLOR = '#6366f1'
const GRANULARITIES: ReportGranularity[] = ['day', 'week', 'month']

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

const KPI_ICONS = {
  revenue: Banknote,
  orders: ShoppingCart,
  conversion: ReceiptText,
  refunds: RotateCcw,
} satisfies Record<ReportKpi['id'], typeof Banknote>

export function ReportsPage({
  search,
  onSearchChange,
}: {
  search: ReportsSearch
  onSearchChange: (updater: (previous: ReportsSearch) => ReportsSearch) => void
}) {
  const { t, i18n } = useTranslation('reports')
  const [metric, setMetric] = useState<ReportMetric>('revenue')
  const [seriesColor, setSeriesColor] = useState(DEFAULT_COLOR)
  const [target, setTarget] = useState(DEFAULT_TARGET)
  const [page, setPage] = useState(1)
  const [draftRange, setDraftRange] = useState<DateRangeValue | null>(null)
  useDocumentTitle(t('title'))

  const range = useMemo(() => resolveReportRange(search), [search])
  const params = useMemo(
    () => ({ from: range.from, to: range.to, granularity: search.granularity }),
    [range.from, range.to, search.granularity],
  )
  const query = useReportQuery(params)
  const data = query.data
  const series = useMemo(() => data?.series ?? [], [data])
  const rows = useMemo(() => data?.rows ?? [], [data])

  const anchors = useMemo<AnchorItem[]>(
    () => [
      { id: 'report-overview', label: t('anchors.overview') },
      { id: 'report-trend', label: t('anchors.trend') },
      { id: 'report-channels', label: t('anchors.channels') },
      { id: 'report-detail', label: t('anchors.detail') },
    ],
    [t],
  )

  const presets = useMemo<DateRangePreset[]>(() => {
    const today = new Date()
    const end = formatDayValue(today)
    const start = (days: number) => formatDayValue(addDays(today, -(days - 1)))
    return [
      { label: t('range.last7'), from: start(7), to: end },
      { label: t('range.last30'), from: start(30), to: end },
      { label: t('range.last90'), from: start(90), to: end },
    ]
  }, [t])

  useEffect(() => {
    setPage(1)
  }, [params.from, params.to, params.granularity])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const revenueKpi = data?.kpis.find((kpi) => kpi.id === 'revenue')

  const belowTarget = useMemo(
    () => series.filter((point) => point.revenue / point.days < target),
    [series, target],
  )

  const changeRange = (value: DateRangeValue) => {
    if (value.from && value.to) {
      setDraftRange(null)
      onSearchChange((previous) => ({ ...previous, from: value.from, to: value.to }))
      return
    }

    if (!value.from && !value.to) {
      setDraftRange(null)
      onSearchChange((previous) => ({ ...previous, from: undefined, to: undefined }))
      return
    }

    setDraftRange(value)
  }

  const exportSummary = () => {
    if (!data) return
    downloadCsv(`report-${data.from}-${data.to}.csv`, [
      [t('detail.columns.date'), t('kpis.revenue'), t('kpis.orders')],
      ...data.series.map((point) => [point.date, point.revenue, point.orders]),
    ])
    toast.success(t('export.toast'))
  }

  const exportDetail = () => {
    if (!data) return
    downloadCsv(`report-detail-${data.from}-${data.to}.csv`, [
      [
        t('detail.columns.date'),
        t('detail.columns.channel'),
        t('detail.columns.revenue'),
        t('detail.columns.orders'),
        t('detail.columns.refunds'),
      ],
      ...data.rows.map((row) => [
        row.date,
        t(`channels.names.${row.channel}`, { defaultValue: row.channel }),
        row.revenue,
        row.orders,
        row.refunds,
      ]),
    ])
    toast.success(t('export.toast'))
  }

  const channelName = (row: ReportRow) =>
    t(`channels.names.${row.channel}`, { defaultValue: row.channel })

  return (
    <>
      <PageContainer
        title={t('title')}
        description={t('subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              value={draftRange ?? range}
              onChange={changeRange}
              presets={presets}
              placeholder={t('range.placeholder')}
              ariaLabel={t('range.label')}
            />
            <Segmented
              aria-label={t('granularity.label')}
              value={search.granularity}
              onValueChange={(value) =>
                onSearchChange((previous) => ({
                  ...previous,
                  granularity: value as ReportGranularity,
                }))
              }
              options={GRANULARITIES.map((granularity) => ({
                value: granularity,
                label: t(`granularity.${granularity}`),
              }))}
              size="sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!data}>
                  <Download aria-hidden className="size-4" />
                  {t('export.label')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={exportSummary}>{t('export.summary')}</DropdownMenuItem>
                <DropdownMenuItem onSelect={exportDetail}>{t('export.detail')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        tabs={
          <div className="flex items-center justify-between gap-3">
            <AnchorNav items={anchors} ariaLabel={t('anchors.label')} orientation="horizontal" />
            {query.isFetching && !query.isPending ? (
              <Spinner label={t('detail.loading')} className="mr-1 shrink-0" />
            ) : null}
          </div>
        }
      >
        {query.isError ? (
          <ErrorState
            title={t('errors.title')}
            description={t('errors.description')}
            onRetry={() => void query.refetch()}
          />
        ) : query.isPending ? (
          <ReportsSkeleton />
        ) : data ? (
          <div className="space-y-6">
            <section id="report-overview" className="scroll-mt-24 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">{t('overview.title')}</h2>
                <TooltipProvider>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {data.kpis.map((kpi) => (
                      <Tooltip key={kpi.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <Info aria-hidden className="size-3.5" />
                            {t(`kpis.${kpi.id}`)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{t(`definitions.${kpi.id}`)}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.kpis.map((kpi) => (
                  <Statistic
                    key={kpi.id}
                    label={t(`kpis.${kpi.id}`)}
                    value={kpi.value}
                    precision={kpi.id === 'conversion' ? 1 : undefined}
                    prefix={kpi.id === 'revenue' || kpi.id === 'refunds' ? '$' : undefined}
                    suffix={kpi.id === 'conversion' ? '%' : undefined}
                    trend={{ value: kpi.change, label: t('comparison') }}
                    icon={KPI_ICONS[kpi.id]}
                  />
                ))}
              </div>

              {belowTarget.length > 0 ? (
                <Alert>
                  <TriangleAlert aria-hidden />
                  <AlertTitle>{t('targetAlert.title', { count: belowTarget.length })}</AlertTitle>
                  <AlertDescription>
                    {t('targetAlert.description', {
                      count: belowTarget.length,
                      total: series.length,
                      target: formatCurrency(target, i18n.language),
                    })}
                  </AlertDescription>
                </Alert>
              ) : (
                <Empty variant="outline" className="p-6 md:p-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CircleCheck aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>{t('targetAlert.okTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {t('targetAlert.okDescription', {
                        target: formatCurrency(target, i18n.language),
                      })}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>

            <section id="report-trend" className="scroll-mt-24">
              <Card className="shadow-soft">
                <CardHeader className="gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{t('trend.title')}</CardTitle>
                      <CardDescription>{t('trend.description')}</CardDescription>
                    </div>
                    {revenueKpi ? (
                      <Trend value={revenueKpi.change} label={t('comparison')} />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('trend.metric.label')}</p>
                      <RadioGroup
                        value={metric}
                        onValueChange={(value) => setMetric(value as ReportMetric)}
                        aria-label={t('trend.metric.label')}
                        className="flex flex-wrap gap-4"
                      >
                        {(['revenue', 'orders'] as ReportMetric[]).map((option) => (
                          <div key={option} className="flex items-center gap-2">
                            <RadioGroupItem value={option} id={`report-metric-${option}`} />
                            <Label htmlFor={`report-metric-${option}`} className="font-normal">
                              {t(`trend.metrics.${option}`)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('trend.color.label')}</p>
                      <ColorPicker
                        value={seriesColor}
                        onValueChange={setSeriesColor}
                        ariaLabel={t('trend.color.aria')}
                        className="w-40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="report-target">{t('target.label')}</Label>
                      <span className="text-xs text-muted-foreground">{t('target.hint')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[target]}
                        onValueChange={(values) => setTarget(values[0] ?? target)}
                        min={TARGET_MIN}
                        max={TARGET_MAX}
                        step={TARGET_STEP}
                        thumbLabels={[t('target.label')]}
                        className="max-w-md"
                      />
                      <InputNumber
                        id="report-target"
                        value={target}
                        onValueChange={(value) => {
                          if (value !== null) setTarget(value)
                        }}
                        min={TARGET_MIN}
                        max={TARGET_MAX}
                        step={TARGET_STEP}
                        aria-label={t('target.label')}
                        className="w-32"
                        size="sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
                    <ReportTrendChart
                      data={series}
                      metric={metric}
                      color={seriesColor}
                      target={target}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </section>

            <section id="report-channels" className="scroll-mt-24">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>{t('channels.title')}</CardTitle>
                  <CardDescription>{t('channels.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.channels.length > 0 ? (
                    <Suspense fallback={<Skeleton className="h-[220px] w-full rounded-xl" />}>
                      <ReportChannelsChart data={data.channels} />
                    </Suspense>
                  ) : (
                    <Empty variant="outline">
                      <EmptyHeader>
                        <EmptyTitle>{t('channels.emptyTitle')}</EmptyTitle>
                        <EmptyDescription>{t('channels.emptyDescription')}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </section>

            <section id="report-detail" className="scroll-mt-24">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle>{t('detail.title')}</CardTitle>
                      <CardDescription>{t('detail.description')}</CardDescription>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('detail.showing', { count: pageRows.length, total: rows.length })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rows.length === 0 ? (
                    <Empty variant="outline">
                      <EmptyHeader>
                        <EmptyTitle>{t('detail.emptyTitle')}</EmptyTitle>
                        <EmptyDescription>{t('detail.emptyDescription')}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('detail.columns.date')}</TableHead>
                            <TableHead>{t('detail.columns.channel')}</TableHead>
                            <TableHead className="text-right">
                              {t('detail.columns.revenue')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('detail.columns.orders')}
                            </TableHead>
                            <TableHead className="text-right">
                              {t('detail.columns.refunds')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{formatDayDisplay(row.date, i18n.language)}</TableCell>
                              <TableCell>{channelName(row)}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCurrency(row.revenue, i18n.language)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.orders.toLocaleString(i18n.language)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatCurrency(row.refunds, i18n.language)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {pageCount > 1 ? (
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                aria-disabled={currentPage <= 1}
                                className={
                                  currentPage <= 1 ? 'pointer-events-none opacity-50' : undefined
                                }
                                onClick={(event) => {
                                  event.preventDefault()
                                  if (currentPage > 1) setPage(currentPage - 1)
                                }}
                              />
                            </PaginationItem>
                            {pageTokens(currentPage, pageCount).map((token) =>
                              typeof token === 'number' ? (
                                <PaginationItem key={token}>
                                  <PaginationLink
                                    href="#"
                                    isActive={token === currentPage}
                                    onClick={(event) => {
                                      event.preventDefault()
                                      setPage(token)
                                    }}
                                  >
                                    {token}
                                  </PaginationLink>
                                </PaginationItem>
                              ) : (
                                <PaginationItem key={token}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              ),
                            )}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                aria-disabled={currentPage >= pageCount}
                                className={
                                  currentPage >= pageCount
                                    ? 'pointer-events-none opacity-50'
                                    : undefined
                                }
                                onClick={(event) => {
                                  event.preventDefault()
                                  if (currentPage < pageCount) setPage(currentPage + 1)
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        ) : null}
      </PageContainer>
      <BackTop />
    </>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
      <Skeleton className="h-[260px] w-full rounded-xl" />
    </div>
  )
}
