import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BellOff, CheckCheck, MailOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  PageContainer,
  Button,
  Card,
  CardContent,
  Checkbox,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  ScrollArea,
  Segmented,
  Spinner,
  cn,
} from '@fish-admin/react'

import { useDocumentTitle } from '@/lib/document-title'
import { formatDateTime, formatRelativeTime } from '@/lib/format'

import type { NotificationFilter, WorkspaceNotification } from '@/types'

import { markAllNotificationsRead, markNotificationsRead, updateNotification } from '../api'
import type { NotificationsSearch } from '../search'
import { notificationIcon, notificationSummary, notificationTitle } from '../notification-meta'
import { useNotificationDetailQuery, useNotificationListQuery } from '../queries'
import { NotificationDetailDrawer } from './notification-detail-drawer'
import { NotificationPreferencesCard } from './notification-preferences-card'

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

export function NotificationsPage({
  search,
  onSearchChange,
}: {
  search: NotificationsSearch
  onSearchChange: (updater: (previous: NotificationsSearch) => NotificationsSearch) => void
}) {
  const { t, i18n } = useTranslation('notifications')
  const queryClient = useQueryClient()
  useDocumentTitle(t('title'))

  const listQuery = useNotificationListQuery({
    page: search.page,
    pageSize: search.pageSize,
    filter: search.filter,
  })
  const detailQuery = useNotificationDetailQuery(search.notification)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelected(new Set())
  }, [search.filter, search.page])

  const items = listQuery.data?.items ?? []
  const unreadCount = listQuery.data?.unreadCount ?? 0
  const pageCount = listQuery.data?.pageCount ?? 1
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id))
  const someSelected = items.some((item) => selected.has(item.id))

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markMutation = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => updateNotification(id, read),
    onSuccess: () => {
      invalidate()
      toast.success(t('list.markOneSuccess'))
    },
  })

  const markSelectedMutation = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: (_data, ids) => {
      setSelected(new Set())
      invalidate()
      toast.success(t('list.markSelectedSuccess', { count: ids.length }))
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (data) => {
      setSelected(new Set())
      invalidate()
      toast.success(t('list.markAllSuccess', { count: data.updated }))
    },
  })

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function openDetail(notification: WorkspaceNotification) {
    if (!notification.read) markMutation.mutate({ id: notification.id, read: true })
    onSearchChange((previous) => ({ ...previous, notification: notification.id }))
  }

  function closeDetail(open: boolean) {
    if (open) return
    onSearchChange((previous) => ({ ...previous, notification: undefined }))
  }

  const detail =
    detailQuery.data ?? items.find((item) => item.id === search.notification) ?? undefined

  const filterOptions: Array<{ value: NotificationFilter; label: string }> = [
    { value: 'all', label: t('filters.all') },
    { value: 'unread', label: t('filters.unread') },
    { value: 'mention', label: t('filters.mention') },
  ]

  return (
    <PageContainer
      title={t('title')}
      description={t('subtitle')}
      actions={
        <Button
          onClick={() => markAllMutation.mutate()}
          disabled={unreadCount === 0 || markAllMutation.isPending}
        >
          <CheckCheck className="size-4" />
          {t('actions.markAllRead')}
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs">
              {unreadCount}
            </span>
          ) : null}
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Segmented
                options={filterOptions}
                value={search.filter}
                onValueChange={(value) =>
                  onSearchChange((previous) => ({
                    ...previous,
                    filter: value as NotificationFilter,
                    page: 1,
                  }))
                }
                aria-label={t('filters.label')}
                size="sm"
              />
              {listQuery.isFetching ? <Spinner size="sm" label={t('list.loading')} /> : null}
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markSelectedMutation.mutate([...selected])}
                  disabled={markSelectedMutation.isPending}
                >
                  <MailOpen className="size-4" />
                  {t('actions.markSelected', { count: selected.size })}
                </Button>
              ) : null}
            </div>
          </div>

          {listQuery.isError ? (
            <ErrorState
              title={t('errors.title')}
              description={t('errors.description')}
              onRetry={() => void listQuery.refetch()}
            />
          ) : listQuery.isPending ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" label={t('list.loading')} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title={search.filter === 'unread' ? t('empty.title') : t('list.emptyTitle')}
              description={
                search.filter === 'unread' ? t('empty.description') : t('list.emptyDescription')
              }
            />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b pb-3">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => {
                    if (checked) setSelected(new Set(items.map((item) => item.id)))
                    else setSelected(new Set())
                  }}
                  aria-label={t('list.selectAll')}
                />
                <span className="text-xs text-muted-foreground">
                  {t('list.selectedCount', { count: selected.size })}
                </span>
              </div>

              <div className="relative">
                <ScrollArea className="max-h-[520px]">
                  <ul aria-label={t('list.ariaLabel')} className="divide-y">
                    {items.map((notification) => {
                      const Icon = notificationIcon(notification.kind)
                      const title = notificationTitle(t, notification)
                      return (
                        <li
                          key={notification.id}
                          className={cn(
                            'flex items-start gap-3 px-1 py-3',
                            !notification.read && 'bg-primary/5',
                          )}
                        >
                          <Checkbox
                            className="mt-1"
                            checked={selected.has(notification.id)}
                            onCheckedChange={(checked) =>
                              toggleSelected(notification.id, checked === true)
                            }
                            aria-label={t('list.selectOne', { title })}
                          />
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Icon aria-hidden className="size-4" />
                          </span>

                          <HoverCard openDelay={300}>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openDetail(notification)}
                                className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              >
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-medium">{title}</span>
                                  {!notification.read ? (
                                    <span
                                      aria-hidden
                                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                                    />
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {notificationSummary(t, notification)}
                                </span>
                                <span className="mt-1 block text-[11px] text-muted-foreground">
                                  {formatRelativeTime(notification.createdAt, i18n.language)}
                                </span>
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent align="start" className="space-y-2 text-sm">
                              <p className="font-medium">{title}</p>
                              <p className="text-xs text-muted-foreground">
                                {t('list.hoverActor', {
                                  actor: notification.actorName ?? t('detail.system'),
                                })}
                              </p>
                              {notification.entityLabel ? (
                                <p className="text-xs text-muted-foreground">
                                  {t('list.hoverEntity', { entity: notification.entityLabel })}
                                </p>
                              ) : null}
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(notification.createdAt, i18n.language)}
                              </p>
                            </HoverCardContent>
                          </HoverCard>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              notification.read ? t('actions.markUnread') : t('actions.markRead')
                            }
                            onClick={() =>
                              markMutation.mutate({
                                id: notification.id,
                                read: !notification.read,
                              })
                            }
                            disabled={markMutation.isPending}
                          >
                            <MailOpen className="size-4" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                </ScrollArea>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
                />
              </div>

              {pageCount > 1 ? (
                <div className="border-t pt-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          aria-disabled={search.page <= 1}
                          className={
                            search.page <= 1 ? 'pointer-events-none opacity-50' : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            if (search.page > 1) {
                              onSearchChange((previous) => ({
                                ...previous,
                                page: previous.page - 1,
                              }))
                            }
                          }}
                        />
                      </PaginationItem>
                      {pageTokens(search.page, pageCount).map((token) =>
                        typeof token === 'number' ? (
                          <PaginationItem key={token}>
                            <PaginationLink
                              href="#"
                              isActive={token === search.page}
                              onClick={(event) => {
                                event.preventDefault()
                                onSearchChange((previous) => ({ ...previous, page: token }))
                              }}
                            >
                              {token}
                            </PaginationLink>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={token}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          aria-disabled={search.page >= pageCount}
                          className={
                            search.page >= pageCount ? 'pointer-events-none opacity-50' : undefined
                          }
                          onClick={(event) => {
                            event.preventDefault()
                            if (search.page < pageCount) {
                              onSearchChange((previous) => ({
                                ...previous,
                                page: previous.page + 1,
                              }))
                            }
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <NotificationPreferencesCard />

      <NotificationDetailDrawer
        notification={detail}
        open={Boolean(search.notification)}
        onOpenChange={closeDetail}
        onReadChange={(notification, read) => markMutation.mutate({ id: notification.id, read })}
        pending={markMutation.isPending}
      />
    </PageContainer>
  )
}
