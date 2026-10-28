import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../../lib/utils'

export type ListItem = {
  id: string
  title: string
  description?: string
  meta?: string
  icon?: LucideIcon
  avatar?: ReactNode
  actions?: ReactNode
  disabled?: boolean
}

export function List({
  items,
  ariaLabel,
  emptyLabel,
  onItemClick,
  selectedId,
  className,
}: {
  /** Rows to render; an empty array switches to the dashed empty state. */
  items: ListItem[]
  /** Accessible name of the list element. */
  ariaLabel: string
  /** Text shown when items is empty. */
  emptyLabel: string
  /** Makes every row body a button; omit it for a read-only list. */
  onItemClick?: (item: ListItem) => void
  /** Id of the highlighted row; also sets aria-current on its button. */
  selectedId?: string
  className?: string
}) {
  if (items.length === 0) {
    return (
      <div
        data-slot="list-empty"
        className={cn(
          'rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        {emptyLabel}
      </div>
    )
  }

  return (
    <ul
      aria-label={ariaLabel}
      data-slot="list"
      className={cn('divide-y overflow-hidden rounded-lg border bg-background', className)}
    >
      {items.map((item) => {
        const Icon = item.icon
        const selected = selectedId === item.id
        const content = (
          <>
            {item.avatar ? (
              <span className="shrink-0">{item.avatar}</span>
            ) : Icon ? (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon aria-hidden className="size-4" />
              </span>
            ) : null}
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              {item.description ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </span>
            {item.meta ? (
              <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
            ) : null}
          </>
        )

        return (
          <li
            key={item.id}
            data-selected={selected || undefined}
            className={cn(
              'flex items-center gap-3 px-4 py-3 transition-colors',
              selected && 'bg-primary/5',
              item.disabled && 'opacity-50',
            )}
          >
            {onItemClick ? (
              <button
                type="button"
                disabled={item.disabled}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onItemClick(item)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
              >
                {content}
              </button>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>
            )}
            {item.actions ? (
              <div className="flex shrink-0 items-center gap-1">{item.actions}</div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
