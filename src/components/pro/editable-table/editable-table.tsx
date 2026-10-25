import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type EditableTableRow = { id: string } & Record<string, unknown>

export type EditableTableColumn = {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  editor?: 'text' | 'number' | 'select'
  options?: { value: string; label: string }[]
  render?: (row: EditableTableRow) => ReactNode
  validate?: (value: unknown, row: EditableTableRow) => string | null
  parse?: (raw: string) => unknown
}

export type EditableTableLabels = {
  add: string
  save: string
  cancel: string
  edit: string
  delete: string
  actions: string
  empty: string
}

export function EditableTable({
  columns,
  rows,
  onRowsChange,
  addRow,
  rowLabel,
  labels,
  ariaLabel,
  className,
}: {
  columns: EditableTableColumn[]
  rows: EditableTableRow[]
  onRowsChange: (rows: EditableTableRow[]) => void
  addRow?: () => EditableTableRow
  rowLabel?: (row: EditableTableRow) => string
  labels: EditableTableLabels
  ariaLabel: string
  className?: string
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditableTableRow | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const editingKey = '__new__'

  function resetEditing() {
    setEditingId(null)
    setDraft(null)
    setIsNew(false)
    setErrors({})
  }

  function startEdit(row: EditableTableRow) {
    setEditingId(row.id)
    setDraft({ ...row })
    setIsNew(false)
    setErrors({})
  }

  function startAdd() {
    if (!addRow) return
    setEditingId(editingKey)
    setDraft(addRow())
    setIsNew(true)
    setErrors({})
  }

  function updateDraft(key: string, value: unknown) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function save() {
    if (!draft) return

    const candidate: EditableTableRow = { ...draft }
    for (const column of columns) {
      if (column.parse) candidate[column.key] = column.parse(String(draft[column.key] ?? ''))
    }

    const nextErrors: Record<string, string> = {}
    for (const column of columns) {
      const message = column.validate?.(candidate[column.key], candidate)
      if (message) nextErrors[column.key] = message
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onRowsChange(
      isNew ? [...rows, candidate] : rows.map((row) => (row.id === candidate.id ? candidate : row)),
    )
    resetEditing()
  }

  function removeRow(row: EditableTableRow) {
    if (editingId === row.id) resetEditing()
    onRowsChange(rows.filter((entry) => entry.id !== row.id))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && editingId) {
      event.preventDefault()
      resetEditing()
    }
  }

  function renderEditor(column: EditableTableColumn) {
    if (!draft) return null
    const value = draft[column.key]
    const error = errors[column.key]

    if (column.editor === 'select') {
      return (
        <select
          aria-label={column.header}
          value={String(value ?? '')}
          onChange={(event) => updateDraft(column.key, event.target.value)}
          className={cn(
            'h-8 w-full min-w-28 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            error && 'border-destructive',
          )}
        >
          {(column.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <Input
        aria-label={column.header}
        aria-invalid={error ? true : undefined}
        type={column.editor === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(event) => updateDraft(column.key, event.target.value)}
        className={cn('h-8 min-w-32', error && 'border-destructive')}
      />
    )
  }

  function renderRow(row: EditableTableRow, forceEditing = false) {
    const editing = forceEditing || editingId === row.id
    const label = rowLabel?.(row) ?? row.id

    return (
      <tr key={row.id} className={cn('border-b last:border-b-0', editing && 'bg-muted/30')}>
        {columns.map((column) => (
          <td
            key={column.key}
            className={cn(
              'px-3 py-2 align-top',
              column.align === 'right' && 'text-right',
              column.align === 'center' && 'text-center',
            )}
            style={{ width: column.width }}
          >
            {editing ? (
              <div className="space-y-1">
                {renderEditor(column)}
                {errors[column.key] ? (
                  <p className="text-xs text-destructive">{errors[column.key]}</p>
                ) : null}
              </div>
            ) : (
              <span className="flex min-h-8 items-center gap-2">
                {column.render ? (
                  column.render(row)
                ) : row[column.key] === '' || row[column.key] === undefined ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  String(row[column.key])
                )}
              </span>
            )}
          </td>
        ))}
        <td className="px-3 py-2 text-right align-top whitespace-nowrap">
          {editing ? (
            <span className="flex min-h-8 items-center justify-end gap-1">
              <Button type="button" size="sm" onClick={save}>
                {labels.save}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetEditing}>
                {labels.cancel}
              </Button>
            </span>
          ) : (
            <span className="flex min-h-8 items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${labels.edit} ${label}`}
                onClick={() => startEdit(row)}
              >
                <Pencil aria-hidden className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${labels.delete} ${label}`}
                onClick={() => removeRow(row)}
              >
                <Trash2 aria-hidden className="size-3.5" />
              </Button>
            </span>
          )}
        </td>
      </tr>
    )
  }

  return (
    <div role="presentation" className={cn('space-y-3', className)} onKeyDown={handleKeyDown}>
      {addRow ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={startAdd}>
            <Plus aria-hidden className="size-4" />
            {labels.add}
          </Button>
        </div>
      ) : null}

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the scroll container must be reachable so keyboard users can scroll wide tables */}
      <div tabIndex={0} className="overflow-x-auto rounded-lg border">
        <table aria-label={ariaLabel} className="w-full min-w-[40rem] text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-3 py-2 font-medium">
                  {column.header}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right font-medium">
                {labels.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => renderRow(row))}
            {editingId === editingKey && draft ? renderRow(draft, true) : null}
            {rows.length === 0 && editingId !== editingKey ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {labels.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
