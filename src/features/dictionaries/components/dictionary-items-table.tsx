import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Popconfirm,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@fish-admin/react'

import type { DictionaryItem } from '@/types'

function moveId(order: string[], sourceId: string, targetId: string) {
  const from = order.indexOf(sourceId)
  const to = order.indexOf(targetId)
  if (from === -1 || to === -1 || from === to) return order
  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, sourceId)
  return next
}

export function DictionaryItemsTable({
  items,
  canManage,
  pendingItemId,
  onEdit,
  onDelete,
  onToggle,
  onReorder,
}: {
  items: DictionaryItem[]
  canManage: boolean
  pendingItemId?: string
  onEdit: (item: DictionaryItem) => void
  onDelete: (item: DictionaryItem) => void
  onToggle: (item: DictionaryItem, enabled: boolean) => void
  onReorder: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const handles = useRef(new Map<string, HTMLButtonElement>())
  const focusAfterMove = useRef<string | null>(null)

  useEffect(() => {
    if (!focusAfterMove.current) return
    handles.current.get(focusAfterMove.current)?.focus()
    focusAfterMove.current = null
  })

  if (items.length === 0) {
    return (
      <Empty variant="outline">
        <EmptyHeader>
          <EmptyTitle>{t('dictionaries:item.empty')}</EmptyTitle>
          <EmptyDescription>{t('dictionaries:item.reorderHint')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const order = items.map((item) => item.id)

  const move = (sourceId: string, targetId: string) => {
    const next = moveId(order, sourceId, targetId)
    if (next !== order) onReorder(next)
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <span className="sr-only">{t('dictionaries:item.order')}</span>
            </TableHead>
            <TableHead>{t('dictionaries:item.label')}</TableHead>
            <TableHead>{t('dictionaries:item.value')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('dictionaries:item.usage')}</TableHead>
            <TableHead>{t('dictionaries:item.status')}</TableHead>
            <TableHead className="w-24 text-end">
              <span className="sr-only">{t('common:actions.more')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const isDragging = draggingId === item.id
            const isDropTarget = dropTargetId === item.id && !isDragging
            const locked = !canManage || pendingItemId === item.id

            return (
              <TableRow
                key={item.id}
                data-item-id={item.id}
                onDragOver={(event) => {
                  if (!canManage || !draggingId) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDropTargetId(item.id)
                }}
                onDragLeave={(event) => {
                  if (
                    event.relatedTarget instanceof Node &&
                    event.currentTarget.contains(event.relatedTarget)
                  ) {
                    return
                  }
                  setDropTargetId((current) => (current === item.id ? null : current))
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceId = event.dataTransfer.getData('text/plain') || draggingId
                  if (sourceId) move(sourceId, item.id)
                  setDraggingId(null)
                  setDropTargetId(null)
                }}
                className={cn(
                  isDragging && 'opacity-50',
                  isDropTarget && 'bg-accent/60 ring-1 ring-primary/30 ring-inset',
                )}
              >
                <TableCell>
                  <button
                    ref={(node) => {
                      if (node) handles.current.set(item.id, node)
                      else handles.current.delete(item.id)
                    }}
                    type="button"
                    draggable={canManage}
                    disabled={!canManage}
                    aria-label={t('dictionaries:item.reorder', { label: item.label })}
                    aria-describedby="dictionary-reorder-hint"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('text/plain', item.id)
                      setDraggingId(item.id)
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDropTargetId(null)
                    }}
                    onKeyDown={(event) => {
                      if (!canManage) return
                      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                      event.preventDefault()
                      const target = items[index + (event.key === 'ArrowUp' ? -1 : 1)]
                      if (!target) return
                      focusAfterMove.current = item.id
                      move(item.id, target.id)
                    }}
                    className="flex size-7 cursor-grab items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-not-allowed"
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.description ? (
                      <span className="hidden max-w-48 truncate text-xs text-muted-foreground lg:inline">
                        {item.description}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.value}</code>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.referenceCount > 0 ? (
                    <Badge variant="secondary">
                      {t('dictionaries:item.referenceCount', { count: item.referenceCount })}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    size="sm"
                    checked={item.enabled}
                    disabled={locked}
                    aria-label={t('dictionaries:item.toggle', { label: item.label })}
                    onCheckedChange={(checked) => onToggle(item, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={!canManage}
                      aria-label={t('dictionaries:item.edit')}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Popconfirm
                      title={t('dictionaries:item.deleteTitle', { label: item.label })}
                      description={
                        item.isSystem
                          ? t('dictionaries:item.deleteBlocked')
                          : item.referenceCount > 0
                            ? t('dictionaries:item.inUse', { count: item.referenceCount })
                            : t('dictionaries:item.deleteDescription')
                      }
                      destructive
                      disabled={!canManage || item.isSystem || item.referenceCount > 0}
                      onConfirm={() => onDelete(item)}
                      confirmLabel={t('common:actions.delete')}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        disabled={!canManage || item.isSystem || item.referenceCount > 0}
                        aria-label={t('dictionaries:item.delete')}
                        title={
                          item.isSystem
                            ? t('dictionaries:item.deleteBlocked')
                            : item.referenceCount > 0
                              ? t('dictionaries:item.inUse', { count: item.referenceCount })
                              : undefined
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </Popconfirm>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <p id="dictionary-reorder-hint" className="text-xs text-muted-foreground">
        {t('dictionaries:item.reorderHint')}
      </p>
    </div>
  )
}
