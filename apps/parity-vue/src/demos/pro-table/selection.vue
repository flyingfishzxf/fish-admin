<script lang="ts">
export default { name: 'ProTableSelection' }
</script>

<script setup lang="ts">
import { createColumnHelper, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import type { CellContext, HeaderContext, RowSelectionState } from '@tanstack/vue-table'
import { computed, h, ref } from 'vue'

import { Checkbox, ProTable } from '@fish-admin/vue'

import { MEMBERS, type DemoMember } from '../../data/members'

const columnHelper = createColumnHelper<DemoMember>()
const rowSelection = ref<RowSelectionState>({})

const columns = [
  {
    id: 'select',
    header: ({ table }: HeaderContext<DemoMember, unknown>) =>
      h(Checkbox, {
        modelValue: table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(checked === true),
        'aria-label': 'Select all rows',
      }),
    cell: ({ row }: CellContext<DemoMember, unknown>) =>
      h(Checkbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (checked: boolean | 'indeterminate') =>
          row.toggleSelected(checked === true),
        'aria-label': `Select ${row.original.name}`,
      }),
    size: 36,
  },
  columnHelper.accessor('name', { header: 'Member' }),
  columnHelper.accessor('team', { header: 'Team' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('joined', { header: 'Joined' }),
]

const table = useVueTable({
  data: MEMBERS,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true,
  state: {
    get rowSelection() {
      return rowSelection.value
    },
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater
  },
})

const selectedCount = computed(() => Object.keys(rowSelection.value).length)
const selection = computed(() => ({
  count: selectedCount.value,
  label: `${selectedCount.value} ${selectedCount.value === 1 ? 'row' : 'rows'} selected`,
  clearLabel: 'Clear selection',
  onClear: () => {
    rowSelection.value = {}
  },
}))
</script>

<template>
  <ProTable :table="table" :selection="selection">
    <template #empty>
      <p class="fish-demo-muted">No members.</p>
    </template>
  </ProTable>
</template>
