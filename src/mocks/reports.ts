import { formatDayValue, parseDay } from '@/lib/date'
import type {
  ReportChannel,
  ReportData,
  ReportGranularity,
  ReportKpi,
  ReportPoint,
  ReportRow,
} from '@/types'

export const REPORT_CHANNEL_KEYS = ['direct', 'organic', 'referral', 'social', 'email'] as const
export const MAX_REPORT_DAYS = 366

function hashText(text: string) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function daySpan(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
}

function bucketStart(date: Date, granularity: ReportGranularity) {
  if (granularity === 'week') {
    const start = new Date(date)
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start
  }
  if (granularity === 'month') {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }
  return new Date(date)
}

interface Bucket {
  date: Date
  days: number
}

function buildBuckets(from: Date, to: Date, granularity: ReportGranularity): Bucket[] {
  const buckets = new Map<string, Bucket>()
  const cursor = new Date(from)

  while (cursor <= to) {
    const start = bucketStart(cursor, granularity)
    const key = formatDayValue(start)
    const bucket = buckets.get(key) ?? { date: start, days: 0 }
    bucket.days += 1
    buckets.set(key, bucket)
    cursor.setDate(cursor.getDate() + 1)
  }

  return [...buckets.values()]
}

interface SeriesTotals {
  series: ReportPoint[]
  rows: ReportRow[]
  channels: ReportChannel[]
  revenue: number
  orders: number
  conversion: number
  refunds: number
}

function buildSeries(buckets: Bucket[], seedText: string): SeriesTotals {
  const random = createRandom(hashText(seedText))
  const weights = REPORT_CHANNEL_KEYS.map(() => 0.6 + random())
  const channelRevenue = REPORT_CHANNEL_KEYS.map(() => 0)
  const series: ReportPoint[] = []
  const rows: ReportRow[] = []

  for (const [index, bucket] of buckets.entries()) {
    const progress = buckets.length > 1 ? index / (buckets.length - 1) : 0
    const growth = 1 + progress * 0.18
    const seasonal = 1 + Math.sin((index + 1) * 1.31) * 0.07
    const noise = 0.92 + random() * 0.16
    const revenue = Math.round(5200 * bucket.days * growth * seasonal * noise)
    const averageOrder = 74 + random() * 18
    const orders = Math.max(1, Math.round(revenue / averageOrder))
    const date = formatDayValue(bucket.date)
    const rawShares = weights.map((weight) => weight * (0.94 + random() * 0.12))
    const shareTotal = rawShares.reduce((sum, share) => sum + share, 0)
    let allocatedRevenue = 0
    let allocatedOrders = 0

    series.push({ date, revenue, orders, days: bucket.days })

    for (const [channelIndex, channel] of REPORT_CHANNEL_KEYS.entries()) {
      const share = (rawShares[channelIndex] ?? 0) / shareTotal
      const last = channelIndex === REPORT_CHANNEL_KEYS.length - 1
      const channelRevenueValue = last ? revenue - allocatedRevenue : Math.round(revenue * share)
      const channelOrders = last
        ? orders - allocatedOrders
        : Math.max(0, Math.round(orders * share))
      const refunds = Math.round(channelRevenueValue * (0.006 + random() * 0.018))

      allocatedRevenue += channelRevenueValue
      allocatedOrders += channelOrders
      channelRevenue[channelIndex] += channelRevenueValue

      rows.push({
        id: `row-${date}-${channel}`,
        date,
        channel,
        revenue: channelRevenueValue,
        orders: channelOrders,
        refunds,
      })
    }
  }

  const revenue = series.reduce((sum, point) => sum + point.revenue, 0)
  const orders = series.reduce((sum, point) => sum + point.orders, 0)
  const refunds = rows.reduce((sum, row) => sum + row.refunds, 0)
  const conversion = 2.4 + random() * 1.2

  return {
    series,
    rows,
    channels: REPORT_CHANNEL_KEYS.map((name, index) => ({
      name,
      value: channelRevenue[index] ?? 0,
    })),
    revenue,
    orders,
    conversion,
    refunds,
  }
}

function change(current: number, previous: number) {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export interface ReportRangeInput {
  from: string
  to: string
  granularity: ReportGranularity
}

export function buildReport({
  from,
  to,
  granularity,
}: ReportRangeInput): Omit<ReportData, 'generatedAt'> {
  const fromDate = parseDay(from)
  const toDate = parseDay(to)
  if (!fromDate || !toDate) {
    throw new Error('Report range must use yyyy-MM-dd dates.')
  }

  const span = daySpan(fromDate, toDate)
  const buckets = buildBuckets(fromDate, toDate, granularity)
  const current = buildSeries(buckets, `${from}:${to}:${granularity}`)

  const previousTo = addDays(fromDate, -1)
  const previousFrom = addDays(previousTo, -(span - 1))
  const previous = buildSeries(
    buildBuckets(previousFrom, previousTo, granularity),
    `${formatDayValue(previousFrom)}:${formatDayValue(previousTo)}:${granularity}`,
  )

  const kpis: ReportKpi[] = [
    { id: 'revenue', value: current.revenue, change: change(current.revenue, previous.revenue) },
    { id: 'orders', value: current.orders, change: change(current.orders, previous.orders) },
    {
      id: 'conversion',
      value: Math.round(current.conversion * 10) / 10,
      change: change(current.conversion, previous.conversion),
    },
    { id: 'refunds', value: current.refunds, change: change(current.refunds, previous.refunds) },
  ]

  return {
    from,
    to,
    granularity,
    kpis,
    series: current.series,
    channels: current.channels,
    rows: current.rows,
  }
}
