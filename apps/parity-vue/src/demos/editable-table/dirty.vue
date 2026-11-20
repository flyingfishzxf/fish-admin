<script lang="ts">
export default { name: 'EditableTableDirty' }
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
  add: 'Add destination',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  actions: 'Actions',
  empty: 'No destinations configured.',
}

const INITIAL_ROWS: EditableTableRow[] = [
  { id: 'dest-1', name: 'Analytics warehouse', frequency: 60, enabled: 'Yes' },
  { id: 'dest-2', name: 'Compliance archive', frequency: 1440, enabled: 'Yes' },
]

const COLUMNS: EditableTableColumn[] = [
  { key: 'name', header: 'Destination', editor: 'text' },
  {
    key: 'frequency',
    header: 'Interval (minutes)',
    editor: 'number',
    align: 'right',
    width: '12rem',
    parse: (raw) => (raw.trim() === '' ? '' : Number(raw)),
    validate: (value) => {
      const minutes = Number(value)
      if (!Number.isFinite(minutes) || minutes <= 0) return 'Use a whole number of minutes.'
      if (minutes < 15) return 'The scheduler floors intervals below 15 minutes.'
      if (minutes > 10080) return 'Weekly is the longest supported interval.'
      return null
    },
  },
  {
    key: 'enabled',
    header: 'Status',
    editor: 'select',
    options: [
      { value: 'Yes', label: 'Active' },
      { value: 'No', label: 'Paused' },
    ],
  },
]

const rows = ref<EditableTableRow[]>(INITIAL_ROWS)
const status = ref('No draft open. Nothing is written until Save passes.')
let nextRowIndex = INITIAL_ROWS.length

function onRowsChange(next: EditableTableRow[]) {
  rows.value = next
  status.value = `Committed ${next.length} rows; the draft and its errors are cleared.`
}

function addRow(): EditableTableRow {
  nextRowIndex += 1
  return {
    id: `dest-${nextRowIndex}`,
    name: '',
    frequency: 60,
    enabled: 'No',
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
    <p class="fish-demo-label" style="margin: 0">Export destinations</p>
    <EditableTable
      :columns="COLUMNS"
      :rows="rows"
      :add-row="addRow"
      :row-label="(row) => String(row.name || 'new destination')"
      :labels="LABELS"
      ariaLabel="Export destinations"
      @update:rows="onRowsChange"
    >
      <template #cell="{ column, row }">
        <template v-if="column.key === 'enabled'">
          {{ String(row.enabled) === 'Yes' ? 'Active' : 'Paused' }}
        </template>
        <template v-else>{{ row[column.key] }}</template>
      </template>
    </EditableTable>
    <p class="fish-demo-muted" role="status">{{ status }}</p>
    <p class="fish-demo-muted" style="margin: 0">
      Adding a row opens it as a draft at the bottom of the table. Escape or Cancel throws the
      draft away, and a failed <code>validate</code> keeps the row open with the message under the
      field.
    </p>
  </div>
</template>
