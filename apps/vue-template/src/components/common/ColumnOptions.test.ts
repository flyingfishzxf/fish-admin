import type { ColumnDef } from '@tanstack/vue-table'
import { DataTable } from '@fish-admin/vue'
import { getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'

import type { ColumnOrderState } from '@tanstack/vue-table'

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

let wrapper: VueWrapper | null = null

function mountHost() {
  const visibility: Ref<Record<string, boolean>> = ref({ status: false })
  const order: Ref<ColumnOrderState> = ref([])

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
          get columnOrder() {
            return order.value
          },
        },
        onColumnVisibilityChange: (updater) => {
          visibility.value =
            typeof updater === 'function'
              ? updater(visibility.value)
              : (updater as Record<string, boolean>)
        },
        onColumnOrderChange: (updater) => {
          order.value =
            typeof updater === 'function'
              ? (updater as (old: ColumnOrderState) => ColumnOrderState)(order.value)
              : updater
        },
        enableColumnResizing: true,
        getCoreRowModel: getCoreRowModel(),
      })

      return () =>
        h('div', [
          h(DataTable as never, { table }),
          h(ColumnOptions as never, { table, visibility: visibility.value, label: 'Columns' }),
          h('pre', { 'data-order': true }, JSON.stringify(order.value)),
        ])
    },
  })

  wrapper = mount(Host, { attachTo: document.body })
  return wrapper
}

function openMenu() {
  document.body
    .querySelector<HTMLElement>('[data-column-options]')!
    .dispatchEvent(new Event('click', { bubbles: true }))
}

describe('ColumnOptions', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
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

  // jsdom has no DragEvent; a plain Event with a dataTransfer stub is enough.
  function dragEvent(type: string, transfer: Record<string, unknown>) {
    const event = new Event(type, { bubbles: true })
    Object.defineProperty(event, 'dataTransfer', { value: transfer })
    return event
  }

  const transfer = {
    setData(kind: string, value: string) {
      this.data = { ...this.data, [kind]: value }
    },
    getData(kind: string) {
      return this.data?.[kind] ?? ''
    },
    data: {} as Record<string, string>,
  }

  function optionRow(id: string) {
    return document.body.querySelector<HTMLElement>(`[data-column-option="${id}"]`)!
  }

  it('reorders through the drag events and the table follows', async () => {
    mountHost()
    await flushPromises()
    openMenu()
    await flushPromises()

    // The name column hides itself from this menu (it stays first), so the
    // reorder targets are email and status.
    const statusHandle = optionRow('status').querySelector('[data-column-handle]')!
    const emailRow = optionRow('email')
    statusHandle.dispatchEvent(dragEvent('dragstart', transfer))
    emailRow.dispatchEvent(dragEvent('dragover', transfer))
    emailRow.dispatchEvent(dragEvent('drop', transfer))
    await flushPromises()

    expect(document.body.querySelector('[data-order]')?.textContent).toBe(
      JSON.stringify(['name', 'status', 'email']),
    )
  })

  it('reorders with the keyboard and keeps focus on the grip', async () => {
    mountHost()
    await flushPromises()
    openMenu()
    await flushPromises()

    const grip = optionRow('email').querySelector('[data-column-handle]') as HTMLElement
    grip.focus()
    grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushPromises()

    expect(document.body.querySelector('[data-order]')?.textContent).toBe(
      JSON.stringify(['name', 'status', 'email']),
    )
    expect(document.activeElement).toBe(optionRow('email').querySelector('[data-column-handle]'))
  })

  it('renders a resize handle for every resizable column', async () => {
    mountHost()
    await flushPromises()

    // The host hides the status column, so two of the three headers render one.
    expect(document.body.querySelectorAll('[data-resize-handle]')).toHaveLength(2)
  })
})
