import { ChevronRight, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useUITranslation } from '../../../i18n'

import { buildTree, treeAncestorIds, visibleTreeEntries } from '../../../lib/tree'
import { cn } from '../../../lib/utils'

export interface TreeItem {
  id: string
  parentId: string | null
  label: string
  description?: string
  badge?: string
  icon?: LucideIcon
  disabled?: boolean
}

function defaultExpandedIds(items: TreeItem[], selectedId?: string | null) {
  const ids = new Set<string>()
  const parentIds = new Set(
    items.map((item) => item.parentId).filter((id): id is string => Boolean(id)),
  )

  for (const item of items) {
    if (!item.parentId && parentIds.has(item.id)) ids.add(item.id)
  }
  if (selectedId) {
    for (const id of treeAncestorIds(items, selectedId)) ids.add(id)
  }

  return ids
}

export function Tree({
  items,
  selectedId,
  onSelect,
  expandedIds,
  onExpandedChange,
  defaultExpanded,
  ariaLabel,
  emptyLabel,
  className,
}: {
  items: TreeItem[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  expandedIds?: ReadonlySet<string>
  onExpandedChange?: (ids: Set<string>) => void
  defaultExpanded?: string[]
  ariaLabel: string
  emptyLabel?: string
  className?: string
}) {
  const { t } = useUITranslation()
  const tree = useMemo(() => buildTree(items), [items])
  const [internalExpanded, setInternalExpanded] = useState<ReadonlySet<string>>(
    () => new Set(defaultExpanded ?? defaultExpandedIds(items, selectedId)),
  )
  const activeExpanded = expandedIds ?? internalExpanded
  const entries = useMemo(() => visibleTreeEntries(tree, activeExpanded), [tree, activeExpanded])

  const [focusedId, setFocusedId] = useState<string | null>(
    () => selectedId ?? entries[0]?.node.id ?? null,
  )
  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  const pendingFocus = useRef(false)

  useEffect(() => {
    if (expandedIds) return
    setInternalExpanded((current) => {
      if (current.size > 0) return current
      return new Set(defaultExpanded ?? defaultExpandedIds(items, selectedId))
    })
  }, [items, selectedId, expandedIds, defaultExpanded])

  useEffect(() => {
    if (focusedId && entries.some((entry) => entry.node.id === focusedId)) return
    setFocusedId(selectedId ?? entries[0]?.node.id ?? null)
  }, [entries, focusedId, selectedId])

  useEffect(() => {
    if (expandedIds || !selectedId) return
    const ancestors = treeAncestorIds(items, selectedId)
    if (ancestors.length === 0) return
    setInternalExpanded((current) => {
      if (ancestors.every((id) => current.has(id))) return current
      return new Set([...current, ...ancestors])
    })
  }, [expandedIds, items, selectedId])

  useEffect(() => {
    if (!pendingFocus.current || !focusedId) return
    pendingFocus.current = false
    itemRefs.current.get(focusedId)?.focus()
  }, [focusedId])

  const focusItem = (id: string) => {
    pendingFocus.current = true
    setFocusedId(id)
    itemRefs.current.get(id)?.focus()
  }

  const toggleExpanded = (id: string) => {
    const next = new Set(activeExpanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)

    if (!expandedIds) setInternalExpanded(next)
    onExpandedChange?.(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!focusedId) return
    const index = entries.findIndex((entry) => entry.node.id === focusedId)
    if (index === -1) return
    const entry = entries[index]!

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (index < entries.length - 1) focusItem(entries[index + 1]!.node.id)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (index > 0) focusItem(entries[index - 1]!.node.id)
        break
      case 'ArrowRight':
        event.preventDefault()
        if (entry.hasChildren && !activeExpanded.has(entry.node.id)) {
          toggleExpanded(entry.node.id)
        } else if (entry.hasChildren) {
          focusItem(entries[index + 1]!.node.id)
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (entry.hasChildren && activeExpanded.has(entry.node.id)) {
          toggleExpanded(entry.node.id)
        } else if (entry.parentId) {
          focusItem(entry.parentId)
        }
        break
      case 'Home':
        event.preventDefault()
        focusItem(entries[0]!.node.id)
        break
      case 'End':
        event.preventDefault()
        focusItem(entries[entries.length - 1]!.node.id)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!entry.node.disabled) onSelect?.(entry.node.id)
        break
    }
  }

  return (
    <div
      role="tree"
      aria-label={ariaLabel}
      tabIndex={-1}
      className={cn('select-none', className)}
      onKeyDown={handleKeyDown}
    >
      {entries.length === 0 && emptyLabel ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : null}
      {entries.map((entry) => {
        const item = entry.node
        const isExpanded = activeExpanded.has(item.id)
        const isSelected = selectedId === item.id
        const Icon = item.icon

        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter and Space are handled by the tree's roving-focus keydown
          <div
            key={item.id}
            ref={(node) => {
              if (node) itemRefs.current.set(item.id, node)
              else itemRefs.current.delete(item.id)
            }}
            role="treeitem"
            aria-level={entry.depth + 1}
            aria-label={item.badge ? `${item.label}${item.badge}` : item.label}
            aria-selected={isSelected}
            aria-expanded={entry.hasChildren ? isExpanded : undefined}
            aria-disabled={item.disabled || undefined}
            tabIndex={focusedId === item.id ? 0 : -1}
            title={item.description}
            onClick={() => {
              if (item.disabled) return
              focusItem(item.id)
              onSelect?.(item.id)
            }}
            onFocus={() => setFocusedId(item.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-transparent py-1.5 pr-2 text-sm transition-colors outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              isSelected && 'bg-primary/10 font-medium text-accent-foreground',
              item.disabled && 'cursor-not-allowed opacity-50',
            )}
            style={{ paddingLeft: `${entry.depth * 16 + 6}px` }}
          >
            {entry.hasChildren ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`${isExpanded ? t('enterprise.collapse') : t('enterprise.expand')} ${item.label}`}
                onClick={(event) => {
                  event.stopPropagation()
                  toggleExpanded(item.id)
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ChevronRight
                  className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
                />
              </button>
            ) : (
              <span aria-hidden className="flex size-5 shrink-0 justify-center">
                <span className="mt-1.5 size-1.5 rounded-full bg-border" />
              </span>
            )}
            {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className="shrink-0 text-xs text-muted-foreground">{item.badge}</span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
