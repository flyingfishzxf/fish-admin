<script setup lang="ts" generic="TData">
import { FlexRender, type Table } from '@tanstack/vue-table'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import Skeleton from '../ui/skeleton/Skeleton.vue'

const props = withDefaults(
  defineProps<{ table: Table<TData>; loading?: boolean; skeletonRows?: number }>(),
  { loading: false, skeletonRows: 6 },
)

const emit = defineEmits<{ 'row-click': [row: TData] }>()

const rows = computed(() => props.table.getRowModel().rows)
const columnCount = computed(() => props.table.getVisibleLeafColumns().length)

const cardClass = 'shadow-soft overflow-hidden rounded-2xl border bg-card'
const scrollClass =
  'overflow-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'
const headBase =
  'h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
// React adds these separators only when a column can resize; resizing is not ported, so match the demo rendering.
const headClass = cn(
  headBase,
  'relative text-[11px] font-semibold tracking-wide text-muted-foreground uppercase',
  'border-e last:border-e-0',
  'bg-muted/35',
)
const cellBase =
  'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]'
const cellClass = cn(cellBase, 'py-3 overflow-hidden')
const skeletonCellClass = cn(cellBase, 'py-3.5')
const emptyCellClass = cn(cellBase, 'p-0')
const rowClass =
  'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted'
const headerRowClass = cn(rowClass, 'hover:bg-transparent')
const clickableRowClass =
  'cursor-pointer focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset'

function onRowKeydown(event: KeyboardEvent, row: TData) {
  if (event.target !== event.currentTarget) return
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('row-click', row)
}
</script>

<template>
  <div :class="cardClass">
    <div v-if="$slots.toolbar" class="border-b p-4">
      <slot name="toolbar" />
    </div>
    <div tabindex="0" :class="scrollClass">
      <table data-slot="table" class="w-full caption-bottom text-sm">
        <thead data-slot="table-header" class="[&_tr]:border-b">
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
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
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
              tabindex="0"
              :class="cn(rowClass, row.getIsSelected() && 'bg-muted/60', clickableRowClass)"
              @click="emit('row-click', row.original)"
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
