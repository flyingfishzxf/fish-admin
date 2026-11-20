<script lang="ts">
export default { name: 'EditableTableBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import {
  EditableTable,
  type EditableTableColumn,
  type EditableTableLabels,
  type EditableTableRow,
} from '@fish-admin/vue'

const LABELS: EditableTableLabels = {
  add: 'Add integration',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  actions: 'Actions',
  empty: 'No sync targets yet.',
}

const PLAN_LABELS: Record<string, string> = {
  sync: 'Nightly sync',
  realtime: 'Realtime stream',
  manual: 'Manual export',
}

const INITIAL_ROWS: EditableTableRow[] = [
  { id: 'row-1', target: 'Acme HR export', owner: 'Dana Cole', plan: 'sync' },
  { id: 'row-2', target: 'Northwind Payroll', owner: 'Ivo Petersen', plan: 'realtime' },
  { id: 'row-3', target: 'Vendor invoices (SAP)', owner: 'Mei Chen', plan: 'manual' },
]

const COLUMNS: EditableTableColumn[] = [
  {
    key: 'target',
    header: 'Integration',
    editor: 'text',
    validate: (value) => (String(value ?? '').trim() ? null : 'Name the integration.'),
  },
  {
    key: 'owner',
    header: 'Owner',
    editor: 'text',
    validate: (value) => (String(value ?? '').trim() ? null : 'Every integration needs an owner.'),
  },
  {
    key: 'plan',
    header: 'Delivery',
    editor: 'select',
    options: [
      { value: 'sync', label: 'Nightly sync' },
      { value: 'realtime', label: 'Realtime stream' },
      { value: 'manual', label: 'Manual export' },
    ],
  },
]

const rows = ref<EditableTableRow[]>(INITIAL_ROWS)
const status = ref('Nothing changed yet.')

function onRowsChange(next: EditableTableRow[]) {
  rows.value = next
  status.value = `${next.length} rows committed. Draft edits are dropped on Cancel.`
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <p class="fish-demo-label" style="margin: 0">Sync targets</p>
    <EditableTable
      :columns="COLUMNS"
      :rows="rows"
      :row-label="(row) => String(row.target ?? row.id)"
      :labels="LABELS"
      ariaLabel="Integration sync targets"
      @update:rows="onRowsChange"
    >
      <template #cell="{ column, row }">
        <template v-if="column.key === 'plan'">
          {{ PLAN_LABELS[String(row.plan)] ?? String(row.plan ?? '') }}
        </template>
        <template v-else>{{ row[column.key] }}</template>
      </template>
    </EditableTable>
    <p class="fish-demo-muted" role="status">{{ status }}</p>
    <p class="fish-demo-muted" style="margin: 0">
      Edit and Delete buttons are named after the row, so a screen reader reads “Edit Acme HR
      export” instead of “Edit”.
    </p>
  </div>
</template>
