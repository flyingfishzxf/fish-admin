import { useMemo, useState } from 'react'

import { Checkbox, ProTable } from '@fish-admin/react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type HeaderContext,
  type RowSelectionState,
} from '@tanstack/react-table'

import { MEMBERS, type DemoMember } from '../data/members'

const columnHelper = createColumnHelper<DemoMember>()

export default function ProTableSelection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: HeaderContext<DemoMember, unknown>) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }: CellContext<DemoMember, unknown>) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked === true)}
            aria-label={`Select ${row.original.name}`}
          />
        ),
        size: 36,
      },
      columnHelper.accessor('name', { header: 'Member' }),
      columnHelper.accessor('team', { header: 'Team' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('joined', { header: 'Joined' }),
    ],
    [],
  )
  const table = useReactTable({
    data: MEMBERS,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  })
  const selectedCount = Object.keys(rowSelection).length

  return (
    <ProTable
      table={table}
      empty={<p className="fish-demo-muted">No members.</p>}
      selection={{
        count: selectedCount,
        label: `${selectedCount} ${selectedCount === 1 ? 'row' : 'rows'} selected`,
        clearLabel: 'Clear selection',
        onClear: () => setRowSelection({}),
      }}
    />
  )
}
