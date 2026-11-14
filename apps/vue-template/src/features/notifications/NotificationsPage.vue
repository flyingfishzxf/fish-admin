<script setup lang="ts">
import type { NotificationFilter, WorkspaceNotification } from '@fish-admin/contracts'
import { Button, Checkbox, Skeleton, cn } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { BellOff, CheckCheck, MailOpen } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import Card from '../../components/ui/Card.vue'
import Pagination from '../../components/ui/Pagination.vue'
import Segmented from '../../components/ui/Segmented.vue'
import { formatRelativeTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { clampToPageCount } from '../../lib/list-page'
import { useTransientMessage } from '../../lib/use-transient-message'
import { markAllNotificationsRead, markNotificationsRead, updateNotification } from './api'
import NotificationDetailDrawer from './NotificationDetailDrawer.vue'
import { notificationIcon, notificationSummary, notificationTitle } from './notification-meta'
import {
  notificationDetailQueryOptions,
  notificationListQueryOptions,
  notificationsQueryKey,
} from './queries'
import { parseNotificationsSearch, toNotificationsQuery, type NotificationsSearch } from './search'

const t = useT('notifications')
const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const feedback = useTransientMessage()

// The URL is the single source of truth for page, page size, filter and the
// open notification. Keeping it there means the bell's deep link, a reload and
// the browser's back button all land on the same view without extra state.
const search = computed<NotificationsSearch>(() =>
  parseNotificationsSearch(route.query as Record<string, string | string[] | undefined>),
)

const listQuery = useQuery(
  notificationListQueryOptions(
    computed(() => ({
      page: search.value.page,
      pageSize: search.value.pageSize,
      filter: search.value.filter,
    })),
  ),
)
const detailQuery = useQuery(
  notificationDetailQueryOptions(computed(() => search.value.notification)),
)

const items = computed(() => listQuery.data.value?.items ?? [])
const unreadCount = computed(() => listQuery.data.value?.unreadCount ?? 0)
const pageCount = computed(() => Math.max(listQuery.data.value?.pageCount ?? 1, 1))

const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => items.value.length > 0 && items.value.every((item) => selected.value.has(item.id)),
)
const someSelected = computed(() => items.value.some((item) => selected.value.has(item.id)))

const filterOptions = computed<{ value: string; label: string }[]>(() => [
  { value: 'all', label: t('filters.all') },
  { value: 'unread', label: t('filters.unread') },
  { value: 'mention', label: t('filters.mention') },
])

const detail = computed(
  () =>
    detailQuery.data.value ??
    items.value.find((item) => item.id === search.value.notification) ??
    undefined,
)

function patchSearch(patch: Partial<NotificationsSearch>) {
  const next = { ...search.value, ...patch }
  void router.replace({ query: toNotificationsQuery(next) })
}

// The API clamps an out-of-range page to the last one it has. Mirror that in the
// URL, or the pager keeps asking for a page that no longer exists.
watch([() => listQuery.data.value?.pageCount, () => listQuery.isPlaceholderData.value], () => {
  if (listQuery.isPlaceholderData.value) return
  const available = listQuery.data.value?.pageCount
  if (available === undefined) return
  const lastPage = clampToPageCount(search.value.page, available)
  if (lastPage !== search.value.page) patchSearch({ page: lastPage })
})

// A checkbox selection belongs to the rows currently on screen: changing the
// filter or the page must not leave ids selected that the user cannot see.
watch([() => search.value.filter, () => search.value.page], () => {
  selected.value = new Set()
})

function invalidate() {
  return queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
}

const markOne = useMutation({
  mutationFn: ({ id, read }: { id: string; read: boolean }) => updateNotification(id, read),
  onSuccess: () => {
    void invalidate()
    feedback.show(t('list.markOneSuccess'))
  },
})

const markSelected = useMutation({
  mutationFn: (ids: string[]) => markNotificationsRead(ids),
  onSuccess: (_result, ids) => {
    selected.value = new Set()
    void invalidate()
    feedback.show(t('list.markSelectedSuccess', { count: ids.length }))
  },
})

const markAll = useMutation({
  mutationFn: () => markAllNotificationsRead(),
  onSuccess: (result) => {
    selected.value = new Set()
    void invalidate()
    feedback.show(t('list.markAllSuccess', { count: result.updated }))
  },
})

function setFilter(value: string) {
  if (value === search.value.filter) return
  patchSearch({ filter: value as NotificationFilter, page: 1 })
}

function toggleSelected(id: string, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(items.value.map((item) => item.id)) : new Set()
}

function openDetail(item: WorkspaceNotification) {
  if (!item.read) markOne.mutate({ id: item.id, read: true })
  patchSearch({ notification: item.id })
}

function closeDetail(open: boolean) {
  if (open) return
  // Only this one parameter: page, filter and page size must survive the close.
  patchSearch({ notification: undefined })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <Button
          data-page-action="mark-all"
          :disabled="unreadCount === 0 || markAll.isPending.value"
          @click="markAll.mutate()"
        >
          <CheckCheck class="size-4" aria-hidden="true" />
          {{ t('actions.markAllRead') }}
          <span
            v-if="unreadCount > 0"
            data-header-unread
            class="rounded-full bg-primary-foreground/20 px-1.5 text-xs"
          >
            {{ unreadCount }}
          </span>
        </Button>
      </template>
    </PageHeader>

    <p v-if="feedback.message.value" role="status" class="text-sm text-muted-foreground">
      {{ feedback.message.value }}
    </p>

    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          :options="filterOptions"
          :model-value="search.filter"
          :aria-label="t('filters.label')"
          @update:model-value="setFilter"
        />
        <Button
          v-if="selected.size > 0"
          variant="outline"
          size="sm"
          data-page-action="mark-selected"
          :disabled="markSelected.isPending.value"
          @click="markSelected.mutate([...selected])"
        >
          <MailOpen class="size-4" aria-hidden="true" />
          {{ t('actions.markSelected', { count: selected.size }) }}
        </Button>
      </div>

      <ErrorState
        v-if="listQuery.isError.value"
        :title="t('errors.title')"
        :description="t('errors.description')"
        :on-retry="() => void listQuery.refetch()"
      />

      <div v-else-if="listQuery.isPending.value" class="space-y-3" data-notifications-loading>
        <Skeleton v-for="row in 5" :key="row" class="h-16 w-full" />
      </div>

      <EmptyState
        v-else-if="items.length === 0"
        :icon="BellOff"
        :title="search.filter === 'unread' ? t('empty.title') : t('list.emptyTitle')"
        :description="
          search.filter === 'unread' ? t('empty.description') : t('list.emptyDescription')
        "
      />

      <template v-else>
        <div class="flex items-center gap-3 border-b pb-3">
          <Checkbox
            :model-value="allSelected ? true : someSelected ? 'indeterminate' : false"
            :aria-label="t('list.selectAll')"
            @update:model-value="toggleAll($event === true)"
          />
          <span class="text-xs text-muted-foreground">
            {{ t('list.selectedCount', { count: selected.size }) }}
          </span>
        </div>

        <ul :aria-label="t('list.ariaLabel')" class="divide-y">
          <li
            v-for="item in items"
            :key="item.id"
            data-notification-row
            :data-unread="item.read ? undefined : 'true'"
            :class="cn('flex items-start gap-3 px-1 py-3', item.read ? undefined : 'bg-primary/5')"
          >
            <Checkbox
              class="mt-1"
              :model-value="selected.has(item.id)"
              :aria-label="t('list.selectOne', { title: notificationTitle(t, item) })"
              @update:model-value="toggleSelected(item.id, $event === true)"
            />
            <span
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <component :is="notificationIcon(item.kind)" class="size-4" aria-hidden="true" />
            </span>

            <button
              type="button"
              data-notification-open
              class="min-w-0 flex-1 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              @click="openDetail(item)"
            >
              <span class="flex items-start justify-between gap-2">
                <span class="text-sm font-medium">{{ notificationTitle(t, item) }}</span>
                <span
                  v-if="!item.read"
                  data-unread-dot
                  aria-hidden="true"
                  class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                />
              </span>
              <span class="mt-0.5 block text-xs text-muted-foreground">
                {{ notificationSummary(t, item) }}
              </span>
              <span class="mt-1 block text-[11px] text-muted-foreground">
                {{ formatRelativeTime(item.createdAt, language) }}
              </span>
            </button>

            <Button
              variant="ghost"
              size="icon-sm"
              data-row-action="toggle-read"
              :aria-label="item.read ? t('actions.markUnread') : t('actions.markRead')"
              :disabled="markOne.isPending.value"
              @click="markOne.mutate({ id: item.id, read: !item.read })"
            >
              <MailOpen class="size-4" aria-hidden="true" />
            </Button>
          </li>
        </ul>

        <div v-if="pageCount > 1" class="border-t pt-2">
          <Pagination
            :page="search.page"
            :page-count="pageCount"
            @update:page="(page) => patchSearch({ page })"
          />
        </div>
      </template>
    </Card>

    <NotificationDetailDrawer
      :notification="detail"
      :open="Boolean(search.notification)"
      :pending="markOne.isPending.value"
      @update:open="closeDetail"
      @read-change="(notification, read) => markOne.mutate({ id: notification.id, read })"
    />
  </div>
</template>
