<script setup lang="ts" generic="TData">
import { FlexRender, type Table } from '@tanstack/vue-table'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import Skeleton from '../ui/skeleton/Skeleton.vue'

const props = withDefaults(
  defineProps<{
    table: Table<TData>
    tableLabel?: string
    loading?: boolean
    skeletonRows?: number
    onRowClick?: (row: TData) => void
    // Same two values and the same paddings as the React `DataTableDensity`,
    // so a page can switch density without the app reaching into these classes.
    density?: 'comfortable' | 'compact'
  }>(),
  { loading: false, skeletonRows: 6, density: 'comfortable' },
)

const rows = computed(() => props.table.getRowModel().rows)
const leaves = computed(() => props.table.getVisibleLeafColumns())
const columnCount = computed(() => leaves.value.length)
const compact = computed(() => props.density === 'compact')

interface GroupRun {
  group: string
  label: string
  width: number
  span: number
}

// React draws a band above the column headers by walking `meta.group`. TanStack
// has no such row, so the runs are built here the same way: adjacent visible
// leaves sharing a group, and no band at all as soon as one column omits it.
const groupRuns = computed<GroupRun[]>(() => {
  const runs: GroupRun[] = []

  for (const column of leaves.value) {
    const meta = (column.columnDef.meta ?? {}) as { group?: string; groupLabel?: string }
    if (!meta.group) return []

    const last = runs[runs.length - 1]
    if (last?.group === meta.group) {
      last.width += column.getSize()
      last.span += 1
    } else {
      runs.push({
        group: meta.group,
        // `groupLabel` may be an empty string on purpose (the actions column),
        // so only an absent label falls back to the key.
        label: meta.groupLabel ?? meta.group,
        width: column.getSize(),
        span: 1,
      })
    }
  }

  return runs
})

const cardClass = 'shadow-soft overflow-hidden rounded-2xl border bg-card'
const scrollClass =
  'overflow-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'
const headBase =
  'px-2 text-start align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
// React adds these separators only when a column can resize; resizing is not ported, so match the demo rendering.
const headClass = computed(() =>
  cn(
    headBase,
    compact.value ? 'h-9' : 'h-10',
    'relative text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
    'border-e last:border-e-0',
    'bg-muted/35',
  ),
)
const cellBase =
  'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
const cellClass = computed(() => cn(cellBase, compact.value ? 'py-1.5' : 'py-3', 'overflow-hidden'))
const skeletonCellClass = computed(() => cn(cellBase, compact.value ? 'py-2' : 'py-3.5'))
const emptyCellClass = cn(cellBase, 'p-0')
// Verbatim from the React data table: the band is not a header, it is a label
// over one, so it keeps the muted strip and drops to 32 px.
const groupHeadClass =
  'h-8 border-b px-2 text-start align-middle text-[11px] font-semibold tracking-wide text-muted-foreground uppercase bg-muted/35'
const rowClass =
  'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted'
const headerRowClass = cn(rowClass, 'hover:bg-transparent')
const clickableRowClass =
  'cursor-pointer focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'

function onRowKeydown(event: KeyboardEvent, row: TData) {
  if (!props.onRowClick || event.target !== event.currentTarget) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  props.onRowClick(row)
}

function ariaSort(column: { getIsSorted: () => false | 'asc' | 'desc' }) {
  const sorted = column.getIsSorted()
  return sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
}
</script>

<template>
  <div :class="cardClass">
    <div v-if="$slots.toolbar" class="border-b p-4">
      <slot name="toolbar" />
    </div>
    <div tabindex="0" :class="scrollClass">
      <table data-slot="table" class="w-full caption-bottom text-sm" :aria-label="tableLabel">
        <thead data-slot="table-header" class="[&_tr]:border-b">
          <tr v-if="groupRuns.length > 0" data-slot="table-row" :class="headerRowClass">
            <th
              v-for="run in groupRuns"
              :key="`${run.group}-${run.label}`"
              data-slot="table-group-head"
              :colspan="run.span"
              :style="{ width: `${run.width}px` }"
              :class="groupHeadClass"
            >
              {{ run.label }}
            </th>
          </tr>
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            data-slot="table-row"
            :class="headerRowClass"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              data-slot="table-head"
              :style="{ width: `${header.getSize()}px` }"
              :class="headClass"
              :aria-sort="header.column.getCanSort() ? ariaSort(header.column) : undefined"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
              <!-- React renders the same handle for every resizable column; it is
                   a mouse/touch affordance and stays out of the tab order. -->
              <button
                v-if="header.column.getCanResize()"
                type="button"
                tabindex="-1"
                :aria-label="`Resize ${header.column.id}`"
                class="absolute inset-y-0 end-0 z-10 w-1.5 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-primary/40"
                :class="header.column.getIsResizing() && 'bg-primary/60'"
                data-resize-handle
                @mousedown="(event) => header.getResizeHandler()(event)"
                @touchstart="(event) => header.getResizeHandler()(event)"
              />
            </th>
          </tr>
        </thead>
        <tbody data-slot="table-body" class="[&_tr:last-child]:border-0">
          <template v-if="loading">
            <tr
              v-for="rowIndex in skeletonRows"
              :key="`skeleton-${rowIndex}`"
              data-slot="table-row"
              :class="headerRowClass"
            >
              <td
                v-for="cellIndex in columnCount"
                :key="cellIndex"
                data-slot="table-cell"
                :class="skeletonCellClass"
              >
                <Skeleton :class="cellIndex === 1 ? 'h-4 w-32' : 'h-4 w-20'" />
              </td>
            </tr>
          </template>
          <template v-else-if="rows.length > 0">
            <tr
              v-for="row in rows"
              :key="row.id"
              data-slot="table-row"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              :tabindex="onRowClick ? 0 : undefined"
              :class="
                cn(rowClass, row.getIsSelected() && 'bg-muted/60', onRowClick && clickableRowClass)
              "
              @click="onRowClick?.(row.original)"
              @keydown="onRowKeydown($event, row.original)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                data-slot="table-cell"
                :style="{ width: `${cell.column.getSize()}px` }"
                :class="cellClass"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </template>
          <tr v-else data-slot="table-row" :class="headerRowClass">
            <td data-slot="table-cell" :colspan="columnCount" :class="emptyCellClass">
              <slot name="empty" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
