<script lang="ts">
export default { name: 'ProTableBasic' }
</script>

<script setup lang="ts">
import { createColumnHelper, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { computed, ref } from 'vue'

import { ProTable } from '@fish-admin/vue'

import { MEMBERS, type DemoMember } from '../../data/members'

const columnHelper = createColumnHelper<DemoMember>()
const columns = [
  columnHelper.accessor('name', { header: 'Member' }),
  columnHelper.accessor('team', { header: 'Team' }),
  columnHelper.accessor('status', { header: 'Status' }),
  columnHelper.accessor('joined', { header: 'Joined' }),
]

const search = ref('')
const rows = computed(() =>
  MEMBERS.filter((member) => member.name.toLowerCase().includes(search.value.trim().toLowerCase())),
)
const table = useVueTable({
  get data() {
    return rows.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
const searchConfig = computed(() => ({
  value: search.value,
  onChange: (value: string) => {
    search.value = value
  },
  placeholder: 'Search members',
  ariaLabel: 'Search members',
  clearLabel: 'Clear search',
}))
</script>

<template>
  <ProTable :table="table" :search="searchConfig">
    <template #empty>
      <p class="fish-demo-muted">No members match this search.</p>
    </template>
  </ProTable>
</template>
