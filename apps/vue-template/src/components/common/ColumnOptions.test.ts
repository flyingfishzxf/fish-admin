import type { ColumnDef } from '@tanstack/vue-table'
import { DataTable } from '@fish-admin/vue'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

import ColumnOptions from './ColumnOptions.vue'

type Member = { id: string; name: string; email: string; status: string }

const members: Member[] = [{ id: 'm1', name: 'Ada', email: 'ada@fish.dev', status: 'active' }]

const columns: ColumnDef<Member>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableHiding: false,
    meta: { label: 'Name', group: 'Identity' },
  },
  { accessorKey: 'email', header: 'Email', meta: { label: 'Email', group: 'Contact' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { label: 'Status', group: 'Access' },
  },
]

function mountHost() {
  const visibility: Ref<Record<string, boolean>> = ref({ status: false })

  const Host = defineComponent({
    setup() {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- Vue composable, not a React hook.
      const table = useVueTable({
        data: members,
        columns,
        state: {
          get columnVisibility() {
            return visibility.value
          },
        },
        onColumnVisibilityChange: (updater) => {
          visibility.value =
            typeof updater === 'function'
              ? updater(visibility.value)
              : (updater as Record<string, boolean>)
        },
        getCoreRowModel: getCoreRowModel(),
      })

      return () =>
        h('div', [
          h(DataTable as never, { table }),
          h(ColumnOptions as never, { table, visibility: visibility.value, label: 'Columns' }),
        ])
    },
  })

  return mount(Host, { attachTo: document.body })
}

function openMenu() {
  document.body
    .querySelector<HTMLElement>('[data-column-options]')!
    .dispatchEvent(new Event('click', { bubbles: true }))
}

describe('ColumnOptions', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('lists only the columns that may be hidden, under their group', async () => {
    const wrapper = mountHost()
    await flushPromises()
    openMenu()
    await flushPromises()

    const ids = Array.from(document.body.querySelectorAll('[data-column-option]')).map((element) =>
      element.getAttribute('data-column-option'),
    )
    expect(ids).toEqual(['email', 'status'])
    expect(document.body.textContent).toContain('Contact')
    expect(document.body.textContent).toContain('Access')

    wrapper.unmount()
  })

  it('reflects the current visibility and toggles a column', async () => {
    const wrapper = mountHost()
    await flushPromises()

    // `status` starts hidden, so its tick is off and its header is gone. The
    // group band cells are `th` too, so the query names the header slot.
    expect(wrapper.findAll('th[data-slot="table-head"]').map((cell) => cell.text())).toEqual([
      'Name',
      'Email',
    ])

    openMenu()
    await flushPromises()
    const statusTick = document.body.querySelector<HTMLElement>(
      '[data-column-option="status"] [data-slot="checkbox"]',
    )!
    expect(statusTick.getAttribute('aria-checked')).toBe('false')

    statusTick.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.findAll('th[data-slot="table-head"]').map((cell) => cell.text())).toEqual([
      'Name',
      'Email',
      'Status',
    ])

    wrapper.unmount()
  })
})
