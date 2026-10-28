import { useState } from 'react'

import { Button, Input, QueryFilter, countActiveFilters } from '@fish-admin/react'
import type { FilterField, FilterValue } from '@fish-admin/react'

const FIELDS: FilterField[] = [
  { type: 'text', name: 'keyword', label: 'Keyword', placeholder: 'Search project name' },
  {
    type: 'select',
    name: 'owner',
    label: 'Owner',
    allLabel: 'Everyone',
    options: [
      { value: 'dana', label: 'Dana Cole' },
      { value: 'mei', label: 'Mei Chen' },
      { value: 'ivo', label: 'Ivo Petersen' },
    ],
  },
  { type: 'boolean', name: 'starred', label: 'Starred projects only' },
  { type: 'dateRange', fromName: 'createdFrom', toName: 'createdTo', label: 'Created between' },
  {
    type: 'custom',
    name: 'minBudget',
    label: 'Minimum budget',
    render: (raw, onValueChange) => (
      <Input
        aria-label="Minimum budget in USD"
        type="number"
        min={0}
        value={typeof raw === 'string' || typeof raw === 'number' ? String(raw) : ''}
        onChange={(event) => onValueChange(event.target.value)}
        style={{ height: '2.25rem' }}
      />
    ),
  },
]

export default function QueryFilterCollapsed() {
  const [value, setValue] = useState<FilterValue>({})
  const [savedView, setSavedView] = useState('')
  const activeCount = countActiveFilters(FIELDS, value)

  return (
    <div className="fish-demo-stack">
      <QueryFilter
        fields={FIELDS}
        value={value}
        onChange={setValue}
        onReset={() => setSavedView('')}
        labels={{ reset: 'Reset filters', more: 'More filters', less: 'Show fewer' }}
        maxVisible={2}
        extra={
          <Button variant="outline" size="sm" onClick={() => setSavedView(JSON.stringify(value))}>
            Save view
          </Button>
        }
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {activeCount === 0
          ? 'No filters set. Expand the bar to reach the date range and budget fields.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} set: ${JSON.stringify(value)}.`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        {savedView
          ? `Saved view ${savedView}. Clearing the bar fires onReset, which drops the saved view too.`
          : 'Hidden fields keep their values — collapsing the bar is a layout change, not a reset.'}
      </p>
    </div>
  )
}
