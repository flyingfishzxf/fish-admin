import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EditableTable from './EditableTable.vue'
import type { EditableTableColumn, EditableTableRow } from './EditableTable.vue'

const columns: EditableTableColumn[] = [
  {
    key: 'name',
    header: 'Name',
    editor: 'text',
    validate: (value) => (!value ? 'Required' : null),
  },
  {
    key: 'role',
    header: 'Role',
    editor: 'select',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'viewer', label: 'Viewer' },
    ],
    parse: (raw) => raw,
  },
]

const rows: EditableTableRow[] = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'viewer' },
]

const labels = {
  add: 'Add',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  actions: 'Actions',
  empty: 'No rows',
}

describe('EditableTable', () => {
  it('renders committed rows with a scoped cell fallback', () => {
    const wrapper = mount(EditableTable, { props: { columns, rows, labels, ariaLabel: 'People' } })
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    expect(wrapper.text()).toContain('Alice')
  })

  it('edits a row and emits the committed value on save', async () => {
    const wrapper = mount(EditableTable, { props: { columns, rows, labels, ariaLabel: 'People' } })

    await wrapper.find('[aria-label="Edit 1"]').trigger('click')
    const name = wrapper.find('input[aria-label="Name"]')
    await name.setValue('Alicia')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save')!
      .trigger('click')

    const next = wrapper.emitted('update:rows')?.at(-1)?.[0] as EditableTableRow[]
    expect(next[0]!.name).toBe('Alicia')
    expect(next[0]!.role).toBe('admin') // parse keeps the select value
  })

  it('blocks a save when validation fails', async () => {
    const wrapper = mount(EditableTable, { props: { columns, rows, labels, ariaLabel: 'People' } })

    await wrapper.find('[aria-label="Edit 1"]').trigger('click')
    await wrapper.find('input[aria-label="Name"]').setValue('')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save')!
      .trigger('click')

    expect(wrapper.text()).toContain('Required')
    expect(wrapper.emitted('update:rows')).toBeUndefined()
  })

  it('adds a fresh row through the add action', async () => {
    const wrapper = mount(EditableTable, {
      props: {
        columns,
        rows,
        labels,
        ariaLabel: 'People',
        addRow: () => ({ id: '3', name: '', role: 'viewer' }),
      },
    })

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add')!
      .trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.find('input[aria-label="Name"]').exists()).toBe(true)
  })
})
