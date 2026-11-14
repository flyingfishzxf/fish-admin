<script setup lang="ts">
import type { AuditAction, AuditEntityType, AuditEvent } from '@fish-admin/contracts'
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@fish-admin/contracts/audit'
import { useQuery } from '@tanstack/vue-query'
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import {
  Badge,
  Button,
  DateRangePicker,
  ProTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
  type DateRangePreset,
  type DateRangeValue,
} from '@fish-admin/vue'
import { ChevronRight, SearchX, ScrollText } from 'lucide-vue-next'
import { computed, h, reactive, ref, watchEffect } from 'vue'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { formatDateTime, formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import AuditDetailDrawer from './AuditDetailDrawer.vue'
import { auditListQueryOptions } from './queries'
import { toneClass } from './tones'
import {
  AUDIT_PRESET_ORDER,
  DEFAULT_AUDIT_SEARCH,
  auditMetadataSummary,
  auditRangePreset,
  type AuditSearch,
} from './search'

const t = useT('audit')
const commonT = useT('common')

const search = reactive<AuditSearch>({ ...DEFAULT_AUDIT_SEARCH })
const list = useQuery(computed(() => auditListQueryOptions({ ...search })))

const events = computed<AuditEvent[]>(() => list.data.value?.items ?? [])
const total = computed(() => list.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(list.data.value?.pageCount ?? 1, 1))
const hasFilters = computed(() =>
  Boolean(search.q || search.action || search.entityType || search.from || search.to),
)

// The server clamps `page` to the last page it can serve. Reflect that back so
// the pager and the query agree instead of showing an empty page. `watchEffect`
// rather than `watch` because the clamped answer can repeat the page the page
// already shows, and a watcher on that value alone would not fire again.
watchEffect(() => {
  const serverPage = list.data.value?.page
  if (!serverPage || list.isPlaceholderData.value) return
  if (serverPage !== search.page) search.page = serverPage
})

function setSearch(value: string) {
  search.q = value.trim() || undefined
  search.page = 1
}

function setAction(value: string) {
  search.action = value === 'all' ? undefined : (value as AuditAction)
  search.page = 1
}

function setEntityType(value: string) {
  search.entityType = value === 'all' ? undefined : (value as AuditEntityType)
  search.page = 1
}

const dateRange = computed<DateRangeValue>({
  get: () => ({ from: search.from, to: search.to }),
  set: (next) => {
    search.from = next.from
    search.to = next.to
    search.page = 1
  },
})

const presets = computed<DateRangePreset[]>(() =>
  AUDIT_PRESET_ORDER.map((preset) => ({
    label: t(`presets.${preset}`),
    ...auditRangePreset(preset),
  })),
)

function clearFilters() {
  search.q = undefined
  search.action = undefined
  search.entityType = undefined
  search.from = undefined
  search.to = undefined
  search.page = 1
}

function goToPage(next: number) {
  search.page = Math.min(Math.max(next, 1), pageCount.value)
}

const summary = computed(() => {
  if (!total.value) return ''
  const from = (search.page - 1) * search.pageSize + 1
  const to = Math.min(search.page * search.pageSize, total.value)
  return commonT('table.summary', { from, to, total: total.value })
})

function actionLabel(action: AuditAction) {
  return t(`actions.${action}`)
}

const selectedEventId = ref<string | null>(null)

function openEvent(event: AuditEvent) {
  selectedEventId.value = event.id
}

const columns = computed<ColumnDef<AuditEvent>[]>(() => [
  {
    accessorKey: 'createdAt',
    header: () => t('columns.time'),
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'text-sm' }, formatDateTime(row.original.createdAt, language.value)),
        h(
          'p',
          { class: 'text-xs text-muted-foreground' },
          formatRelativeTime(row.original.createdAt, language.value),
        ),
      ]),
  },
  {
    accessorKey: 'actorName',
    header: () => t('columns.actor'),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'block max-w-40 truncate text-sm' },
        row.original.actorName || t('actorFallback'),
      ),
  },
  {
    accessorKey: 'action',
    header: () => t('columns.action'),
    cell: ({ row }) =>
      h(
        Badge,
        {
          variant: 'outline',
          class: cn('gap-1 font-normal', toneClass(row.original.action)),
        },
        () => actionLabel(row.original.action),
      ),
  },
  {
    accessorKey: 'entityLabel',
    header: () => t('columns.entity'),
    cell: ({ row }) =>
      h('div', { class: 'min-w-0 space-y-0.5' }, [
        h('p', { class: 'text-sm font-medium break-words' }, row.original.entityLabel),
        h(
          'p',
          { class: 'text-xs text-muted-foreground' },
          t(`entities.${row.original.entityType}`),
        ),
      ]),
  },
  {
    id: 'metadata',
    header: () => t('columns.metadata'),
    cell: ({ row }) => {
      const summary = auditMetadataSummary(row.original)
      return h(
        'span',
        { class: 'block max-w-64 text-xs break-words text-muted-foreground' },
        summary || '—',
      )
    },
  },
  {
    id: 'details',
    header: () => h('span', { class: 'sr-only' }, t('columns.details')),
    cell: ({ row }) => {
      const event = row.original
      return h(
        Button,
        {
          variant: 'ghost',
          size: 'icon-sm',
          class: 'ms-auto',
          'aria-label': `${t('detail.open')}: ${actionLabel(event.action)}`,
          'data-event-id': event.id,
          'data-action': 'open-event',
          onClick: (pointer: MouseEvent) => {
            pointer.stopPropagation()
            openEvent(event)
          },
        },
        () => h(ChevronRight, { class: 'size-4', 'aria-hidden': 'true' }),
      )
    },
  },
])

const table = useVueTable({
  get data() {
    return events.value
  },
  get columns() {
    return columns.value
  },
  get pageCount() {
    return pageCount.value
  },
  getRowId: (row) => row.id,
  manualPagination: true,
  enableSorting: false,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')" />

    <ErrorState
      v-if="list.isError.value && !events.length"
      :title="t('loadError')"
      :on-retry="() => list.refetch()"
    />
    <template v-else>
      <p v-if="list.isError.value" role="alert" class="text-sm text-destructive">
        {{ t('loadError') }}
      </p>
      <ProTable
        :table="table"
        :loading="list.isPending.value"
        :fetching="list.isFetching.value && !list.isPending.value"
        :fetching-label="commonT('states.loading')"
        :table-label="t('title')"
        :on-row-click="openEvent"
        :search="{
          value: search.q ?? '',
          onChange: setSearch,
          placeholder: t('searchPlaceholder'),
          ariaLabel: commonT('actions.search'),
          clearLabel: commonT('actions.clearSearch'),
        }"
      >
        <template #filters>
          <Select :model-value="search.action ?? 'all'" @update:model-value="setAction">
            <SelectTrigger class="h-9 w-[10.5rem]" :aria-label="t('filters.action')">
              <SelectValue
                :label="search.action ? actionLabel(search.action) : t('filters.allActions')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('filters.allActions') }}</SelectItem>
              <SelectItem v-for="action in AUDIT_ACTIONS" :key="action" :value="action">
                {{ actionLabel(action) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select :model-value="search.entityType ?? 'all'" @update:model-value="setEntityType">
            <SelectTrigger class="h-9 w-[9.5rem]" :aria-label="t('filters.entity')">
              <SelectValue
                :label="
                  search.entityType ? t(`entities.${search.entityType}`) : t('filters.allEntities')
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('filters.allEntities') }}</SelectItem>
              <SelectItem v-for="entity in AUDIT_ENTITY_TYPES" :key="entity" :value="entity">
                {{ t(`entities.${entity}`) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            v-model="dateRange"
            :placeholder="t('filters.dateRange')"
            :ariaLabel="t('filters.dateRange')"
            :presets="presets"
            class="h-9 w-full sm:w-[15rem]"
          />

          <Button v-if="hasFilters" variant="ghost" size="sm" class="h-9" @click="clearFilters">
            {{ t('filters.clear') }}
          </Button>
        </template>

        <template #empty>
          <EmptyState
            v-if="hasFilters"
            :icon="SearchX"
            :title="t('empty.title')"
            :description="t('empty.description')"
          >
            <template #action>
              <Button variant="outline" size="sm" @click="clearFilters">
                {{ t('empty.action') }}
              </Button>
            </template>
          </EmptyState>
          <EmptyState
            v-else
            :icon="ScrollText"
            :title="t('empty.title')"
            :description="t('empty.unfiltered')"
          />
        </template>
      </ProTable>

      <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span class="flex flex-wrap items-center gap-3">
          <span>{{ commonT('table.pageOf', { page: search.page, pageCount }) }}</span>
          <span v-if="summary" class="hidden sm:inline">{{ summary }}</span>
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
    </template>

    <AuditDetailDrawer :event-id="selectedEventId" @close="selectedEventId = null" />
  </div>
</template>
