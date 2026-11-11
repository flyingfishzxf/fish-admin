import type { ColumnDef, Table } from '@tanstack/vue-table'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import BulkActionsBar from './BulkActionsBar.vue'
import DataTable from './DataTable.vue'

type Member = { id: string; name: string }

const members: Member[] = [{ id: 'm1', name: 'Ada' }]
const columns: ColumnDef<Member>[] = [{ accessorKey: 'name', header: 'Name' }]

const TableView = DataTable as unknown as Component<{
  table: Table<Member>
  onRowClick?: (row: Member) => void
}>

function mountTable(onRowClick?: (row: Member) => void) {
  const Host = defineComponent({
    setup() {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- Vue composable, not a React hook.
      const table = useVueTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
      })
      return () => h(TableView, { table, onRowClick })
    },
  })

  return mount(Host)
}

describe('DataTable', () => {
  it('leaves rows inert without a click handler', () => {
    const wrapper = mountTable()
    const row = wrapper.get('tbody [data-slot="table-row"]')

    expect(row.attributes('tabindex')).toBeUndefined()
    expect(row.classes()).not.toContain('cursor-pointer')
  })

  it('makes rows focusable and clickable when given a handler', async () => {
    const onRowClick = vi.fn()
    const wrapper = mountTable(onRowClick)
    const row = wrapper.get('tbody [data-slot="table-row"]')

    expect(row.attributes('tabindex')).toBe('0')
    expect(row.classes()).toContain('cursor-pointer')

    await row.trigger('click')
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: ' ' })

    expect(onRowClick).toHaveBeenCalledTimes(3)
    expect(onRowClick).toHaveBeenNthCalledWith(1, members[0])
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
