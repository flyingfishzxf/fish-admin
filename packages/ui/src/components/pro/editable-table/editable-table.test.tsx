import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  EditableTable,
  type EditableTableColumn,
  type EditableTableLabels,
  type EditableTableRow,
} from './editable-table'

const rows: EditableTableRow[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@fish.dev', role: 'admin' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@fish.dev', role: 'editor' },
]

const columns: EditableTableColumn[] = [
  {
    key: 'name',
    header: 'Name',
    editor: 'text',
    validate: (value) => (String(value ?? '').trim() ? null : 'Name is required'),
  },
  {
    key: 'email',
    header: 'Email',
    editor: 'text',
    validate: (value) => (String(value ?? '').includes('@') ? null : 'Enter a valid email'),
  },
  {
    key: 'role',
    header: 'Role',
    editor: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'editor', label: 'Editor' },
    ],
  },
]

const labels: EditableTableLabels = {
  add: 'Add member',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  actions: 'Actions',
  empty: 'No members yet',
}

function renderTable(overrides: { onRowsChange?: (rows: EditableTableRow[]) => void } = {}) {
  const onRowsChange = overrides.onRowsChange ?? vi.fn()
  render(
    <EditableTable
      columns={columns}
      rows={rows}
      onRowsChange={onRowsChange}
      addRow={() => ({ id: 'new-member', name: '', email: '', role: 'editor' })}
      rowLabel={(row) => String(row.name)}
      labels={labels}
      ariaLabel="Team members"
    />,
  )
  return onRowsChange
}

describe('EditableTable', () => {
  it('edits a row and saves the changed values', async () => {
    const user = userEvent.setup()
    const onRowsChange = renderTable()

    await user.click(screen.getByRole('button', { name: 'Edit Ada Lovelace' }))
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.clear(name)
    await user.type(name, 'Ada Byron')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onRowsChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'ada', name: 'Ada Byron' }),
      rows[1],
    ])
  })

  it('keeps the row open and reports validation errors', async () => {
    const user = userEvent.setup()
    const onRowsChange = renderTable()

    await user.click(screen.getByRole('button', { name: 'Edit Ada Lovelace' }))
    await user.clear(screen.getByRole('textbox', { name: 'Email' }))
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'invalid')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true')
    expect(onRowsChange).not.toHaveBeenCalled()
  })

  it('cancels an edit with Escape', async () => {
    const user = userEvent.setup()
    const onRowsChange = renderTable()

    await user.click(screen.getByRole('button', { name: 'Edit Grace Hopper' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '!')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument()
    expect(onRowsChange).not.toHaveBeenCalled()
  })

  it('adds and removes rows', async () => {
    const user = userEvent.setup()
    const onRowsChange = renderTable()

    await user.click(screen.getByRole('button', { name: 'Add member' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Katherine Johnson')
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'katherine@fish.dev')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Role' }), 'admin')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onRowsChange).toHaveBeenLastCalledWith([
      rows[0],
      rows[1],
      expect.objectContaining({
        id: 'new-member',
        name: 'Katherine Johnson',
        email: 'katherine@fish.dev',
        role: 'admin',
      }),
    ])
  })

  it('deletes a row', async () => {
    const user = userEvent.setup()
    const onRowsChange = renderTable()

    await user.click(screen.getByRole('button', { name: 'Delete Grace Hopper' }))

    expect(onRowsChange).toHaveBeenCalledWith([rows[0]])
  })
})
