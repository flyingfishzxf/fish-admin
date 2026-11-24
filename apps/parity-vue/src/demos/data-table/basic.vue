<script lang="ts">
export default { name: 'DataTableBasic' }
</script>

<script setup lang="ts">
import { createColumnHelper, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { ref } from 'vue'

import { DataTable } from '@fish-admin/vue'

import { MEMBERS, type DemoMember } from '../../data/members'

const columnHelper = createColumnHelper<DemoMember>()
const columns = [
  columnHelper.accessor('name', { header: 'Member' }),
  columnHelper.accessor('team', { header: 'Team' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('joined', { header: 'Joined' }),
]

const selected = ref<string | null>(null)
const table = useVueTable({
  data: MEMBERS,
  columns,
  getCoreRowModel: getCoreRowModel(),
})

function onRowClick(row: DemoMember) {
  selected.value = row.name
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <DataTable :table="table" table-label="Workspace members" :on-row-click="onRowClick" />
    <p class="fish-demo-muted" role="status" style="margin: 0" aria-live="polite">
      {{
        selected
          ? `${selected} is selected. Rows are buttons, so Enter and Space work too.`
          : 'Click a row to select it — the whole row is a button when onRowClick is passed.'
      }}
    </p>
  </div>
</template>
