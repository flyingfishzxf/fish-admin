import { Bell, type LucideIcon } from 'lucide-react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { cn } from '../../../lib/utils'

export type NotificationItem = {
  id: string
  title: string
  description?: string
  time: string
  read?: boolean
  icon?: LucideIcon
}

export function NotificationCenter({
  items,
  onItemClick,
  onMarkAllRead,
  unreadCount,
  onViewAll,
  viewAllLabel,
  ariaLabel,
  title,
  markAllLabel,
  emptyLabel,
  className,
}: {
  /** Notifications to list, newest first. */
  items: NotificationItem[]
  /** Opened notification; use it to mark the item read in your data. */
  onItemClick?: (item: NotificationItem) => void
  /** Enables the header button; it is disabled when nothing is unread. */
  onMarkAllRead?: () => void
  /** Overrides the count derived from items; pass the server total. */
  unreadCount?: number
  /** Renders a footer button that opens the full inbox. */
  onViewAll?: () => void
  /** Footer button text; defaults to the localized "View all notifications". */
  viewAllLabel?: string
  /** Accessible name of the bell trigger; defaults to "Notifications". */
  ariaLabel?: string
  /** Panel heading; defaults to "Notifications". */
  title?: string
  /** Mark-all button text; defaults to "Mark all read". */
  markAllLabel?: string
  /** Text shown when items is empty; defaults to "You're all caught up.". */
  emptyLabel?: string
  className?: string
}) {
  const { t } = useUITranslation()
  const unread = unreadCount ?? items.filter((item) => !item.read).length
  const label = ariaLabel ?? t('enterprise.notifications')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            unread > 0 ? t('enterprise.notificationsWithUnread', { label, count: unread }) : label
          }
          data-slot="notification-center"
          className={cn('relative', className)}
        >
          <Bell aria-hidden className="size-4" />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground"
            >
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0 sm:w-96">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <p className="text-sm font-semibold">{title ?? t('enterprise.notifications')}</p>
          <Button
            type="button"
            variant="link"
            size="xs"
            disabled={unread === 0 || !onMarkAllRead}
            onClick={onMarkAllRead}
          >
            {markAllLabel ?? t('enterprise.markAllRead')}
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {emptyLabel ?? t('enterprise.noNotifications')}
            </p>
          ) : (
            <ul>
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-accent focus-visible:bg-accent',
                        !item.read && 'bg-primary/5',
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {Icon ? <Icon aria-hidden className="size-4" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{item.title}</span>
                          {!item.read ? (
                            <span
                              aria-hidden
                              className="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                            />
                          ) : null}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {item.time}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        {onViewAll ? (
          <div className="border-t p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
              {viewAllLabel ?? t('enterprise.viewAllNotifications')}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
