import type { ColumnDef, Table } from '@tanstack/vue-table'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import BulkActionsBar from './BulkActionsBar.vue'
import DataTable from './DataTable.vue'

type Member = { id: string; name: string }

const members: Member[] = [{ id: 'm1', name: 'Ada' }]
const columns: ColumnDef<Member>[] = [{ accessorKey: 'name', header: 'Name', enableSorting: true }]

const TableView = DataTable as unknown as Component<{
  table: Table<Member>
  tableLabel?: string
  onRowClick?: (row: Member) => void
}>

function makeTable() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Vue composable, not a React hook.
  return useVueTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
}

function mountTable(onRowClick?: (row: Member) => void) {
  const table = makeTable()
  const Host = defineComponent({
    setup() {
      return () => h(TableView, { table, onRowClick })
    },
  })

  return { wrapper: mount(Host), table }
}

describe('DataTable', () => {
  it('leaves rows inert without a click handler', () => {
    const { wrapper } = mountTable()
    const row = wrapper.get('tbody [data-slot="table-row"]')

    expect(row.attributes('tabindex')).toBeUndefined()
    expect(row.classes()).not.toContain('cursor-pointer')
  })

  it('makes rows focusable and clickable when given a handler', async () => {
    const onRowClick = vi.fn()
    const { wrapper } = mountTable(onRowClick)
    const row = wrapper.get('tbody [data-slot="table-row"]')

    expect(row.attributes('tabindex')).toBe('0')
    expect(row.classes()).toContain('cursor-pointer')

    await row.trigger('click')
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: ' ' })

    expect(onRowClick).toHaveBeenCalledTimes(3)
    expect(onRowClick).toHaveBeenNthCalledWith(1, members[0])
  })

  it('labels the table region', () => {
    const wrapper = mount(TableView, {
      props: { table: makeTable(), tableLabel: 'Members' },
    })
    expect(wrapper.get('table').attributes('aria-label')).toBe('Members')
  })

  it('exposes aria-sort on sortable headers', async () => {
    const { wrapper, table } = mountTable()
    table.getColumn('name')?.toggleSorting(false)
    await nextTick()
    expect(wrapper.get('thead th').attributes('aria-sort')).toBe('ascending')
    table.getColumn('name')?.toggleSorting(true)
    await nextTick()
    expect(wrapper.get('thead th').attributes('aria-sort')).toBe('descending')
  })

  it('keeps the comfortable padding unless asked for compact', () => {
    const roomy = mount(TableView, { props: { table: makeTable() } })
    expect(roomy.get('tbody td').classes()).toContain('py-3')
    expect(roomy.get('thead th').classes()).toContain('h-10')

    const dense = mount(TableView, { props: { table: makeTable(), density: 'compact' } })
    expect(dense.get('tbody td').classes()).toContain('py-1.5')
    expect(dense.get('tbody td').classes()).not.toContain('py-3')
    expect(dense.get('thead th').classes()).toContain('h-9')
  })

  it('bands adjacent columns that share a group', () => {
    const grouped: ColumnDef<Member>[] = [
      { accessorKey: 'name', header: 'Name', meta: { group: 'identity', groupLabel: 'Identity' } },
      { id: 'email', header: 'Email', meta: { group: 'contact', groupLabel: 'Contact' } },
      { id: 'phone', header: 'Phone', meta: { group: 'contact', groupLabel: 'Contact' } },
    ]

    const table = useVueTable({
      data: members,
      columns: grouped,
      getCoreRowModel: getCoreRowModel(),
    })
    const wrapper = mount(TableView, { props: { table } })

    const band = wrapper.findAll('thead th[data-slot="table-group-head"]')
    expect(band.map((cell) => cell.text())).toEqual(['Identity', 'Contact'])
    expect(band.map((cell) => cell.attributes('colspan'))).toEqual(['1', '2'])
  })

  it('drops the band when one column omits its group', () => {
    const mixed: ColumnDef<Member>[] = [
      { accessorKey: 'name', header: 'Name', meta: { group: 'identity', groupLabel: 'Identity' } },
      { id: 'email', header: 'Email' },
    ]

    const table = useVueTable({ data: members, columns: mixed, getCoreRowModel: getCoreRowModel() })
    const wrapper = mount(TableView, { props: { table } })

    expect(wrapper.find('thead th[data-slot="table-group-head"]').exists()).toBe(false)
  })
})

describe('BulkActionsBar', () => {
  it('names its region and emits clear', async () => {
    const wrapper = mount(BulkActionsBar, {
      props: { label: '2 rows selected', clearLabel: 'Clear selection' },
      slots: { default: '<button type="button">Archive</button>' },
    })

    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-label')).toBe('2 rows selected')

    await wrapper.get('button[aria-label="Clear selection"]').trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
