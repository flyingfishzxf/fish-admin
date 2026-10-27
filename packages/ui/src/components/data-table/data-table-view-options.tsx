import type { Table as TableInstance } from '@tanstack/react-table'
import { GripVertical, SlidersHorizontal } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useUITranslation } from '../../i18n'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '../../lib/utils'

import { moveColumnOrder } from './column-order'

export function DataTableViewOptions<TData>({ table }: { table: TableInstance<TData> }) {
  const { t } = useUITranslation()
  const hintId = useId()
  const [open, setOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const handleRefs = useRef(new Map<string, HTMLButtonElement>())
  const focusAfterMove = useRef<string | null>(null)

  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide())

  useEffect(() => {
    if (!focusAfterMove.current) return
    handleRefs.current.get(focusAfterMove.current)?.focus()
    focusAfterMove.current = null
  })

  function moveColumn(sourceId: string, targetId: string) {
    const currentOrder = table.getState().columnOrder
    const baseOrder =
      currentOrder.length > 0 ? currentOrder : table.getAllLeafColumns().map((column) => column.id)
    const nextOrder = moveColumnOrder(baseOrder, sourceId, targetId)
    if (nextOrder === baseOrder) return
    table.setColumnOrder(nextOrder)
  }

  function clearDragState() {
    setDraggingId(null)
    setDropTargetId(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">{t('table.columns')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={t('table.columns')} className="w-60 p-2">
        <div className="border-b px-2 pt-1 pb-2">
          <p className="text-sm font-medium">{t('table.columns')}</p>
          <p id={hintId} className="text-xs text-muted-foreground">
            {t('table.reorderHint')}
          </p>
        </div>
        <div className="pt-1">
          {columns.map((column) => {
            const label = column.columnDef.meta?.label ?? column.id
            const checkboxId = `${hintId}-${column.id}`
            const isDragging = draggingId === column.id
            const isDropTarget = dropTargetId === column.id && !isDragging

            return (
              <div
                key={column.id}
                data-column-id={column.id}
                onDragOver={(event) => {
                  if (!draggingId) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDropTargetId(column.id)
                }}
                onDragLeave={(event) => {
                  if (
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                  ) {
                    return
                  }
                  setDropTargetId((current) => (current === column.id ? null : current))
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceId = event.dataTransfer.getData('text/plain') || draggingId
                  if (sourceId) moveColumn(sourceId, column.id)
                  clearDragState()
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md py-0.5 pr-1.5 pl-0.5 transition-colors',
                  isDragging && 'opacity-50',
                  isDropTarget && 'bg-accent ring-1 ring-primary/40',
                )}
              >
                <button
                  ref={(node) => {
                    if (node) handleRefs.current.set(column.id, node)
                    else handleRefs.current.delete(column.id)
                  }}
                  type="button"
                  draggable
                  aria-label={t('table.reorderColumn', { column: label })}
                  aria-describedby={hintId}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', column.id)
                    setDraggingId(column.id)
                  }}
                  onDragEnd={clearDragState}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                    event.preventDefault()
                    const index = columns.findIndex((item) => item.id === column.id)
                    const target = columns[index + (event.key === 'ArrowUp' ? -1 : 1)]
                    if (!target) return
                    focusAfterMove.current = column.id
                    moveColumn(column.id, target.id)
                  }}
                  className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
                >
                  <GripVertical className="size-4" aria-hidden />
                </button>
                <Checkbox
                  id={checkboxId}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                />
                <label
                  htmlFor={checkboxId}
                  className="min-w-0 flex-1 cursor-pointer truncate py-1.5 text-sm"
                >
                  {label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
