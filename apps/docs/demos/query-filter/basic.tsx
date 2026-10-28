import { useState } from 'react'

import { Button, QueryFilter, countActiveFilters } from '@fish-admin/react'
import type { FilterField, FilterValue } from '@fish-admin/react'

const FIELDS: FilterField[] = [
  { type: 'text', name: 'keyword', label: 'Keyword', placeholder: 'Project or owner name' },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    allLabel: 'All statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  { type: 'boolean', name: 'overdue', label: 'Only overdue tasks' },
]

export default function QueryFilterBasic() {
  const [value, setValue] = useState<FilterValue>({})
  const [applied, setApplied] = useState<FilterValue | null>(null)
  const activeCount = countActiveFilters(FIELDS, value)

  return (
    <div className="fish-demo-stack">
      <QueryFilter
        fields={FIELDS}
        value={value}
        onChange={setValue}
        labels={{ reset: 'Clear filters', more: 'More filters', less: 'Fewer filters' }}
        extra={
          <Button size="sm" onClick={() => setApplied(value)}>
            Apply to list
          </Button>
        }
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {activeCount === 0
          ? 'No filters active — the list shows every project.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} active.`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        {applied
          ? `Applied: ${JSON.stringify(applied)}`
          : 'Nothing applied yet; typing a keyword only stages the value.'}
      </p>
    </div>
  )
}
