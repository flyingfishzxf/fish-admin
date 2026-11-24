<script lang="ts">
export default { name: 'DataTableLoading' }
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

const loading = ref(false)
const density = ref<'comfortable' | 'compact'>('comfortable')

const table = useVueTable({
  data: MEMBERS,
  columns,
  getCoreRowModel: getCoreRowModel(),
})

function toggle() {
  loading.value = true
  window.setTimeout(() => (loading.value = false), 1200)
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="toggle"> Preview the loading state </Button>
      <Button
        size="sm"
        :variant="density === 'compact' ? 'secondary' : 'outline'"
        :aria-pressed="density === 'compact'"
        @click="density = density === 'compact' ? 'comfortable' : 'compact'"
      >
        Switch to {{ density === 'compact' ? 'comfortable' : 'compact' }} density
      </Button>
    </div>
    <DataTable
      :table="table"
      table-label="Workspace members"
      :loading="loading"
      :skeleton-rows="4"
      :density="density"
    />
    <p class="fish-demo-muted" style="margin: 0">
      Loading replaces every row with {{ 4 }} skeleton rows and marks the region busy; density only
      changes the paddings, never the columns.
    </p>
  </div>
</template>
