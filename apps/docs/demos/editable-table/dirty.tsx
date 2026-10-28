import { useRef, useState } from 'react'

import {
  EditableTable,
  type EditableTableColumn,
  type EditableTableLabels,
  type EditableTableRow,
} from '@fish-admin/react'

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
  {
    key: 'name',
    header: 'Destination',
    editor: 'text',
    validate: (value) => (String(value ?? '').trim() ? null : 'A destination name is required.'),
  },
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
    render: (row) => (String(row.enabled) === 'Yes' ? 'Active' : 'Paused'),
  },
]

export default function EditableTableDirty() {
  const [rows, setRows] = useState<EditableTableRow[]>(INITIAL_ROWS)
  const [status, setStatus] = useState('No draft open. Nothing is written until Save passes.')
  const nextRowIndex = useRef(INITIAL_ROWS.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Export destinations
      </p>
      <EditableTable
        columns={COLUMNS}
        rows={rows}
        onRowsChange={(next) => {
          setRows(next)
          setStatus(`Committed ${next.length} rows; the draft and its errors are cleared.`)
        }}
        addRow={() => {
          nextRowIndex.current += 1
          return {
            id: `dest-${nextRowIndex.current}`,
            name: '',
            frequency: 60,
            enabled: 'No',
          }
        }}
        rowLabel={(row) => String(row.name || 'new destination')}
        labels={LABELS}
        ariaLabel="Export destinations"
      />
      <p className="fish-demo-muted" role="status">
        {status}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Adding a row opens it as a draft at the bottom of the table. Escape or Cancel throws the
        draft away, and a failed <code>validate</code> keeps the row open with the message under the
        field.
      </p>
    </div>
  )
}
