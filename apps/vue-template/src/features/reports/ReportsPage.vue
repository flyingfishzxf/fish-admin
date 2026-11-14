<script setup lang="ts">
import type { ReportData, ReportGranularity, ReportRow } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ProTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { ChevronDown } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import AreaChart from '../../components/ui/chart/AreaChart.vue'
import DonutChart from '../../components/ui/chart/DonutChart.vue'
import ColorPicker from '../../components/ui/ColorPicker.vue'
import InputNumber from '../../components/ui/InputNumber.vue'
import RadioGroup from '../../components/ui/RadioGroup.vue'
import Slider from '../../components/ui/Slider.vue'
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { language, useT } from '../../lib/i18n'
import { clampToPageCount } from '../../lib/list-page'
import { useTransientMessage } from '../../lib/use-transient-message'
import { reportsQueryOptions } from './queries'
import {
  DEFAULT_REPORT_SEARCH,
  REPORT_GRANULARITIES,
  REPORT_RANGES,
  toDateRange,
  type ReportSearch,
} from './search'

type ReportMetric = 'revenue' | 'orders'

const TARGET_MIN = 1000
const TARGET_MAX = 20000
const TARGET_STEP = 100
const DEFAULT_TARGET = 5800
const DEFAULT_COLOR = '#6366f1'
const CHANNEL_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const t = useT('reports')
const commonT = useT('common')
const search = reactive<ReportSearch>({ ...DEFAULT_REPORT_SEARCH })

const metric = ref<ReportMetric>('revenue')
const seriesColor = ref(DEFAULT_COLOR)
const target = ref(DEFAULT_TARGET)
const { message: exportMessage, show: showExportMessage } = useTransientMessage()

const params = computed(() => ({
  ...toDateRange(search.range),
  granularity: search.granularity,
}))
const reportsQuery = useQuery(reportsQueryOptions(params))
const report = computed<ReportData | undefined>(() => reportsQuery.data.value)
const rows = computed<ReportRow[]>(() => report.value?.rows ?? [])
const series = computed(() => report.value?.series ?? [])
const channels = computed(() => report.value?.channels ?? [])
const revenueKpi = computed(() => report.value?.kpis.find((kpi) => kpi.id === 'revenue'))

const PAGE_SIZE = 10
const pageCount = computed(() => Math.max(Math.ceil(rows.value.length / PAGE_SIZE), 1))
const visibleRows = computed(() =>
  rows.value.slice((search.page - 1) * PAGE_SIZE, search.page * PAGE_SIZE),
)

// A narrower range can leave `search.page` past the end. Placeholder data
// belongs to the previous query key and must not pull the page backwards.
watch(
  [pageCount, () => reportsQuery.isPlaceholderData.value],
  ([availablePages, isPlaceholder]) => {
    search.page = clampToPageCount(search.page, availablePages, isPlaceholder)
  },
)

const kpis = computed(() =>
  (report.value?.kpis ?? []).map((kpi) => ({
    id: kpi.id,
    label: t(`kpis.${kpi.id}`),
    value: formatKpi(kpi.id, kpi.value),
    change: kpi.change,
  })),
)

const metricOptions = computed(() => [
  { value: 'revenue', label: t('trend.metrics.revenue') },
  { value: 'orders', label: t('trend.metrics.orders') },
])

// The server reports totals per bucket, so the chart divides by `days` to show
// a daily average the target line can be compared against.
const trendPoints = computed(() =>
  series.value.map((point) => ({
    label: formatDate(point.date, language.value),
    value:
      metric.value === 'revenue'
        ? Math.round(point.revenue / point.days)
        : point.orders / point.days,
    tooltip: formatDate(point.date, language.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  })),
)

const channelSeries = computed(() =>
  channels.value.map((channel, index) => ({
    name: channel.name,
    label: t(`channels.names.${channel.name}`, { defaultValue: channel.name }),
    color: CHANNEL_COLORS[index % CHANNEL_COLORS.length]!,
  })),
)

const channelTotal = computed(() => channels.value.reduce((sum, channel) => sum + channel.value, 0))

const trendReference = computed(() =>
  metric.value === 'revenue' ? { value: target.value, label: t('trend.targetLine') } : undefined,
)

function channelShare(value: number) {
  return channelTotal.value > 0 ? (value / channelTotal.value) * 100 : 0
}

function formatKpi(id: string, value: number) {
  if (id === 'revenue' || id === 'refunds') return formatCurrency(value, language.value)
  if (id === 'conversion') return formatPercent(value, language.value)
  return formatNumber(value, language.value)
}

function formatTrendValue(value: number) {
  return metric.value === 'revenue'
    ? formatCurrency(value, language.value)
    : formatNumber(value, language.value, { maximumFractionDigits: 1 })
}

function formatAxis(value: number) {
  return formatCompactNumber(value, language.value)
}

function formatChannelValue(value: number) {
  return formatCurrency(value, language.value)
}

function exportSummary() {
  const data = report.value
  if (!data) return
  downloadCsv(`report-${data.from}-${data.to}.csv`, [
    [t('detail.columns.date'), t('kpis.revenue'), t('kpis.orders')],
    ...data.series.map((point) => [point.date, point.revenue, point.orders]),
  ])
  showExportMessage(t('export.toast'))
}

function exportDetail() {
  const data = report.value
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
  showExportMessage(t('export.toast'))
}

const columns = computed<ColumnDef<ReportRow>[]>(() => [
  {
    accessorKey: 'date',
    header: () => t('detail.columns.date'),
    // `new Date('yyyy-MM-dd')` parses as UTC midnight and can render the
    // previous day in negative-offset time zones; the bucket label is already
    // an unambiguous ISO date, so show it verbatim.
    cell: ({ row }) => row.original.date,
  },
  {
    accessorKey: 'channel',
    header: () => t('detail.columns.channel'),
    cell: ({ row }) => t(`channels.names.${row.original.channel}`),
  },
  {
    accessorKey: 'revenue',
    header: () => t('detail.columns.revenue'),
    cell: ({ row }) => formatCurrency(row.original.revenue, language.value),
  },
  {
    accessorKey: 'orders',
    header: () => t('detail.columns.orders'),
    cell: ({ row }) => formatNumber(row.original.orders, language.value),
  },
  {
    accessorKey: 'refunds',
    header: () => t('detail.columns.refunds'),
    cell: ({ row }) => formatCurrency(row.original.refunds, language.value),
  },
])

const table = useVueTable({
  get data() {
    return visibleRows.value
  },
  get columns() {
    return columns.value
  },
  get pageCount() {
    return pageCount.value
  },
  manualPagination: true,
  // `/reports` has no server-side sort parameter; keep every header static.
  enableSorting: false,
  getCoreRowModel: getCoreRowModel(),
})

function setRange(value: string) {
  search.range = value as ReportSearch['range']
  search.page = 1
}

function setGranularity(value: string) {
  search.granularity = value as ReportGranularity
  search.page = 1
}

function goToPage(page: number) {
  search.page = Math.min(Math.max(page, 1), pageCount.value)
}
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')">
      <template #toolbar>
        <Select :model-value="search.range" @update:model-value="setRange">
          <SelectTrigger class="h-9 w-[9rem]" :aria-label="t('range.label')">
            <SelectValue :label="t(`range.${search.range}`)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in REPORT_RANGES" :key="option" :value="option">
              {{ t(`range.${option}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="search.granularity" @update:model-value="setGranularity">
          <SelectTrigger class="h-9 w-[8rem]" :aria-label="t('granularity.label')">
            <SelectValue :label="t(`granularity.${search.granularity}`)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in REPORT_GRANULARITIES" :key="option" :value="option">
              {{ t(`granularity.${option}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm" data-report-export :disabled="!report">
              {{ t('export.label') }}
              <ChevronDown class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-export="summary" @select="exportSummary">
              {{ t('export.summary') }}
            </DropdownMenuItem>
            <DropdownMenuItem data-export="detail" @select="exportDetail">
              {{ t('export.detail') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </ListPageHeader>

    <p v-if="exportMessage" data-export-message role="status" class="text-sm text-success">
      {{ exportMessage }}
    </p>

    <ErrorState
      v-if="reportsQuery.isError.value && !report"
      :title="t('errors.title')"
      :description="t('errors.description')"
      :on-retry="() => reportsQuery.refetch()"
    />
    <template v-else>
      <p v-if="reportsQuery.isError.value" role="alert" class="text-sm text-destructive">
        {{ t('errors.description') }}
      </p>

      <section aria-labelledby="reports-overview" class="space-y-3">
        <h2 id="reports-overview" class="text-lg font-semibold">{{ t('overview.title') }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="kpi in kpis"
            :key="kpi.id"
            :aria-label="kpi.label"
            class="shadow-soft rounded-xl border bg-card p-5"
          >
            <p class="text-sm font-medium text-muted-foreground">{{ kpi.label }}</p>
            <p class="text-2xl font-semibold tracking-tight tabular-nums">{{ kpi.value }}</p>
            <p class="text-xs text-muted-foreground">
              <span :class="kpi.change >= 0 ? 'text-success' : 'text-destructive'">
                {{ kpi.change >= 0 ? '+' : '' }}{{ formatPercent(kpi.change, language) }}
              </span>
              {{ t('comparison') }}
            </p>
          </article>
        </div>
      </section>

      <section
        id="report-trend"
        data-report-card="trend"
        aria-labelledby="reports-trend"
        class="shadow-soft scroll-mt-24 rounded-xl border bg-card p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <h2 id="reports-trend" class="leading-none font-semibold">{{ t('trend.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('trend.description') }}</p>
          </div>
          <p v-if="revenueKpi" class="text-sm font-medium tabular-nums">
            <span :class="revenueKpi.change >= 0 ? 'text-success' : 'text-destructive'">
              {{ revenueKpi.change >= 0 ? '+' : ''
              }}{{ formatPercent(revenueKpi.change, language) }}
            </span>
            <span class="ms-1 font-normal text-muted-foreground">{{ t('comparison') }}</span>
          </p>
        </div>

        <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div class="space-y-2">
            <p class="text-sm font-medium">{{ t('trend.metric.label') }}</p>
            <RadioGroup
              v-model="metric"
              :options="metricOptions"
              :aria-label="t('trend.metric.label')"
            />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium">{{ t('trend.color.label') }}</p>
            <ColorPicker
              v-model="seriesColor"
              :aria-label="t('trend.color.aria')"
              class="w-40 p-3"
            />
          </div>
        </div>

        <div class="mt-4 space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label for="report-target" class="text-sm font-medium">{{ t('target.label') }}</label>
            <span class="text-xs text-muted-foreground">{{ t('target.hint') }}</span>
          </div>
          <div class="flex items-center gap-3">
            <Slider
              v-model="target"
              :min="TARGET_MIN"
              :max="TARGET_MAX"
              :step="TARGET_STEP"
              :aria-label="t('target.label')"
              class="max-w-md"
            />
            <InputNumber
              id="report-target"
              v-model="target"
              :min="TARGET_MIN"
              :max="TARGET_MAX"
              :step="TARGET_STEP"
              :aria-label="t('target.label')"
              class="w-32"
            />
          </div>
        </div>

        <div class="mt-4">
          <AreaChart
            v-if="trendPoints.length"
            data-report-chart="trend"
            :ariaLabel="t('trend.title')"
            :data="trendPoints"
            :color="seriesColor"
            :series-label="t(`trend.metrics.${metric}`)"
            :value-format="formatTrendValue"
            :y-format="formatAxis"
            :reference="trendReference"
            :height="300"
          />
          <EmptyState
            v-else
            :title="t('trend.title')"
            :description="t('channels.emptyDescription')"
          />
        </div>
      </section>

      <section
        id="report-channels"
        data-report-card="channels"
        aria-labelledby="reports-channels"
        class="shadow-soft scroll-mt-24 rounded-xl border bg-card p-5"
      >
        <div class="space-y-1">
          <h2 id="reports-channels" class="leading-none font-semibold">
            {{ t('channels.title') }}
          </h2>
          <p class="text-sm text-muted-foreground">{{ t('channels.description') }}</p>
        </div>

        <div
          v-if="channelSeries.length"
          class="mt-4 grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-center"
        >
          <DonutChart
            data-report-chart="channels"
            :ariaLabel="t('channels.title')"
            :data="channels"
            :series="channelSeries"
            :value-format="formatChannelValue"
            :size="220"
          />

          <ul class="space-y-3">
            <li
              v-for="channel in channelSeries"
              :key="channel.name"
              :data-report-channel="channel.name"
              class="space-y-1"
            >
              <div class="flex items-center gap-2 text-sm">
                <span
                  class="size-2.5 shrink-0 rounded-full"
                  :style="{ backgroundColor: channel.color }"
                />
                <span class="flex-1 truncate text-muted-foreground">{{ channel.label }}</span>
                <span class="font-medium tabular-nums">{{
                  formatChannelValue(
                    channels.find((item) => item.name === channel.name)?.value ?? 0,
                  )
                }}</span>
                <span class="w-14 text-end text-xs text-muted-foreground tabular-nums">
                  {{
                    formatPercent(
                      channelShare(channels.find((item) => item.name === channel.name)?.value ?? 0),
                      language,
                    )
                  }}
                </span>
              </div>
              <div class="ms-4.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full"
                  :style="{
                    width: `${channelShare(channels.find((item) => item.name === channel.name)?.value ?? 0)}%`,
                    backgroundColor: channel.color,
                  }"
                />
              </div>
            </li>
          </ul>
        </div>

        <EmptyState
          v-else
          class="mt-4"
          :title="t('channels.emptyTitle')"
          :description="t('channels.emptyDescription')"
        />
      </section>

      <section aria-labelledby="reports-detail" class="space-y-3">
        <h2 id="reports-detail" class="text-lg font-semibold">{{ t('detail.title') }}</h2>
        <p class="text-sm text-muted-foreground">{{ t('detail.description') }}</p>
        <ProTable
          :table="table"
          :loading="reportsQuery.isPending.value"
          :fetching="reportsQuery.isFetching.value && !reportsQuery.isPending.value"
          :fetching-label="t('detail.loading')"
          :table-label="t('detail.title')"
        >
          <template #empty>
            <EmptyState
              :title="t('detail.emptyTitle')"
              :description="t('detail.emptyDescription')"
            />
          </template>
        </ProTable>

        <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span role="status">
            {{ t('detail.showing', { count: visibleRows.length, total: rows.length }) }}
          </span>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="search.page <= 1"
              :aria-label="commonT('table.previous')"
              @click="goToPage(search.page - 1)"
            >
              ←
            </Button>
            <span>{{ commonT('table.pageOf', { page: search.page, pageCount }) }}</span>
            <Button
              variant="outline"
              size="sm"
              :disabled="search.page >= pageCount"
              :aria-label="commonT('table.next')"
              @click="goToPage(search.page + 1)"
            >
              →
            </Button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
