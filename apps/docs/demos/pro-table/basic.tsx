import { useMemo, useState } from 'react'

import { ProTable } from '@fish-admin/react'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { MEMBERS, type DemoMember } from '../data/members'

const columnHelper = createColumnHelper<DemoMember>()

export default function ProTableBasic() {
  const [search, setSearch] = useState('')
  const rows = useMemo(
    () =>
      MEMBERS.filter((member) => member.name.toLowerCase().includes(search.trim().toLowerCase())),
    [search],
  )
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Member' }),
      columnHelper.accessor('team', { header: 'Team' }),
      columnHelper.accessor('status', { header: 'Status' }),
      columnHelper.accessor('joined', { header: 'Joined' }),
    ],
    [],
  )
  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <ProTable
      table={table}
      empty={<p className="fish-demo-muted">No members match this search.</p>}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Search members',
        ariaLabel: 'Search members',
        clearLabel: 'Clear search',
      }}
    />
  )
}
