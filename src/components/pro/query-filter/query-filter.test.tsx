import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { QueryFilter } from '@/components/pro/query-filter/query-filter'
import type { FilterField, FilterValue } from '@/components/pro/query-filter/query-filter-types'
import { Input } from '@/components/ui/input'
import { ensureNamespaces } from '@/lib/i18n'

const fields: FilterField[] = [
  { type: 'text', name: 'q', label: 'Keyword', placeholder: 'Search keyword' },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    allLabel: 'All statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'disabled', label: 'Disabled' },
    ],
  },
  { type: 'boolean', name: 'flagged', label: 'Flagged' },
  {
    type: 'dateRange',
    fromName: 'from',
    toName: 'to',
    label: 'Created',
    placeholder: 'Pick dates',
  },
  {
    type: 'custom',
    name: 'score',
    label: 'Score',
    render: (value, onValueChange) => (
      <Input
        aria-label="Score"
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onValueChange(event.target.value)}
      />
    ),
  },
]

function Harness({
  onReset,
  onChange,
  maxVisible,
}: {
  onReset?: () => void
  onChange?: (next: FilterValue) => void
  maxVisible?: number
}) {
  const [value, setValue] = useState<FilterValue>({})

  return (
    <QueryFilter
      fields={fields}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      onReset={onReset}
      labels={{ reset: 'Reset', more: 'More', less: 'Less' }}
      maxVisible={maxVisible}
    />
  )
}

describe('QueryFilter', () => {
  beforeAll(async () => {
    await ensureNamespaces('common')
  })

  it('renders the first fields and expands the remaining ones', () => {
    render(<Harness />)

    expect(screen.getByLabelText('Keyword')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Flagged' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Created/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Score')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'More' }))

    expect(screen.getByRole('button', { name: 'Less' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /^Created/ })).toHaveTextContent('Pick dates')
    expect(screen.getByRole('group', { name: 'Score' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Less' }))

    expect(screen.queryByRole('button', { name: /^Created/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Score')).not.toBeInTheDocument()
  })

  it('updates text, select and boolean filters', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'ada' } })
    expect(screen.getByLabelText('Keyword')).toHaveValue('ada')
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'Active' }))
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Active')

    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(await screen.findByRole('option', { name: 'All statuses' }))
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('All statuses')

    const flagged = screen.getByRole('switch', { name: 'Flagged' })
    await user.click(flagged)
    expect(flagged).toBeChecked()
  })

  it('resets every value and notifies the reset handler', () => {
    const onReset = vi.fn()
    const onChange = vi.fn()
    render(<Harness onReset={onReset} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'ada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(onChange).toHaveBeenLastCalledWith({})
    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Keyword')).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
  })

  it('hides the reset button when no filter is active', () => {
    render(<Harness />)

    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'ada' } })
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: '   ' } })
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
  })

  it('renders custom fields with their own change handler', () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Score' }), {
      target: { value: '7' },
    })

    expect(screen.getByRole('textbox', { name: 'Score' })).toHaveValue('7')
    expect(onChange).toHaveBeenLastCalledWith({ score: '7' })
  })
})
