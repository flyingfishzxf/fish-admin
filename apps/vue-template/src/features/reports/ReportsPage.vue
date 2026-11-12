<script setup lang="ts">
import type { ReportData, ReportGranularity, ReportRow } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import {
  Button,
  ProTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { computed, reactive, watch } from 'vue'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { clampToPageCount } from '../../lib/list-page'
import { reportsQueryOptions } from './queries'
import {
  DEFAULT_REPORT_SEARCH,
  REPORT_GRANULARITIES,
  REPORT_RANGES,
  toDateRange,
  type ReportSearch,
} from './search'

const t = useT('reports')
const commonT = useT('common')
const search = reactive<ReportSearch>({ ...DEFAULT_REPORT_SEARCH })

const params = computed(() => ({
  ...toDateRange(search.range),
  granularity: search.granularity,
}))
const reportsQuery = useQuery(reportsQueryOptions(params))
const report = computed<ReportData | undefined>(() => reportsQuery.data.value)
const rows = computed<ReportRow[]>(() => report.value?.rows ?? [])

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

function formatKpi(id: string, value: number) {
  if (id === 'revenue' || id === 'refunds') return formatCurrency(value, language.value)
  if (id === 'conversion') return formatPercent(value, language.value)
  return formatNumber(value, language.value)
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
      </template>
    </ListPageHeader>

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
