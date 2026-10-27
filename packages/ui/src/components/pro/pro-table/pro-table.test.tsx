import { fireEvent, render, screen, within } from '@testing-library/react'
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { ProTable, type ProTableProps } from './pro-table'
import { Button } from '../../ui/button'

type Person = {
  id: string
  name: string
}

const people: Person[] = [
  { id: '1', name: 'Ada Lovelace' },
  { id: '2', name: 'Grace Hopper' },
]

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.original.name,
  },
]

function TestTable({
  data = people,
  ...props
}: Omit<ProTableProps<Person>, 'table' | 'empty'> & { data?: Person[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return <ProTable table={table} empty={<p>No results</p>} {...props} />
}

describe('ProTable', () => {
  beforeAll(async () => {})

  it('renders table rows and the empty slot', () => {
    const { unmount } = render(<TestTable />)

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()

    unmount()
    render(<TestTable data={[]} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('changes and clears the search value', () => {
    const onChange = vi.fn()
    render(
      <TestTable
        search={{
          value: 'ada',
          onChange,
          placeholder: 'Search people',
          ariaLabel: 'Search people',
          clearLabel: 'Clear search',
        }}
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Search people' })
    expect(input).toHaveValue('ada')

    fireEvent.change(input, { target: { value: 'grace' } })
    expect(onChange).toHaveBeenCalledWith('grace')

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('renders filters, actions and the fetching status', () => {
    render(
      <TestTable
        filters={<span>Status filter</span>}
        actions={<Button>Export</Button>}
        fetching
        fetchingLabel="Refreshing"
      />,
    )

    expect(screen.getByText('Status filter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Refreshing')
  })

  it('renders pagination and forwards page changes', () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <TestTable
        pagination={{
          page: 1,
          pageCount: 2,
          total: 2,
          pageSize: 10,
          onPageChange,
          onPageSizeChange,
        }}
      />,
    )

    expect(screen.getByText('Showing 1–2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows the selection bar and clears the selection', () => {
    const onClear = vi.fn()

    render(
      <TestTable
        selection={{
          count: 2,
          label: '2 selected',
          clearLabel: 'Clear selection',
          onClear,
          children: <Button>Delete</Button>,
        }}
      />,
    )

    const bar = screen.getByRole('region', { name: '2 selected' })
    expect(within(bar).getByText('2 selected')).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Delete' })).toBeInTheDocument()

    fireEvent.click(within(bar).getByRole('button', { name: 'Clear selection' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('hides the selection bar when nothing is selected', () => {
    render(
      <TestTable
        selection={{
          count: 0,
          label: '0 selected',
          clearLabel: 'Clear selection',
          onClear: vi.fn(),
        }}
      />,
    )

    expect(screen.queryByRole('region', { name: '0 selected' })).not.toBeInTheDocument()
  })

  it('fires onRowClick with the row data', () => {
    const onRowClick = vi.fn()
    render(<TestTable onRowClick={onRowClick} />)

    fireEvent.click(screen.getByText('Ada Lovelace'))

    expect(onRowClick).toHaveBeenCalledWith(people[0])
  })

  it('replaces the default toolbar with a custom one', () => {
    render(
      <TestTable
        toolbar={<div>Custom toolbar</div>}
        search={{
          value: '',
          onChange: vi.fn(),
          placeholder: 'Search people',
          ariaLabel: 'Search people',
          clearLabel: 'Clear search',
        }}
      />,
    )

    expect(screen.getByText('Custom toolbar')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Search people' })).not.toBeInTheDocument()
  })
})
