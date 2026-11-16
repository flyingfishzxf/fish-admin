<script setup lang="ts">
import type { WorkspaceNotification } from '@fish-admin/contracts'
import { Button } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Bell } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { markAllNotificationsRead, updateNotification } from '../../features/notifications/api'
import {
  notificationIcon,
  notificationSummary,
  notificationTitle,
  relativeTime,
} from '../../features/notifications/notification-meta'
import {
  notificationSummaryQueryOptions,
  notificationsQueryKey,
} from '../../features/notifications/queries'
import { useT } from '../../lib/i18n'
import Popover from '../ui/Popover.vue'

const t = useT('notifications')
const router = useRouter()
const queryClient = useQueryClient()
const summary = useQuery(notificationSummaryQueryOptions())

const items = computed(() => summary.data.value?.items ?? [])
const unread = computed(() => summary.data.value?.unreadCount ?? 0)
const badge = computed(() => (unread.value > 9 ? '9+' : String(unread.value)))

function invalidate() {
  return queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
}

const markOne = useMutation({
  mutationFn: (id: string) => updateNotification(id, true),
  onSuccess: () => void invalidate(),
})

const markAll = useMutation({
  mutationFn: () => markAllNotificationsRead(),
  onSuccess: () => void invalidate(),
})

async function openItem(item: WorkspaceNotification) {
  if (!item.read) await markOne.mutateAsync(item.id)
  await router.push({ path: '/notifications', query: { notification: item.id } })
}

function viewAll() {
  void invalidate()
  void router.push('/notifications')
}
</script>

<template>
  <Popover class="w-80 p-0">
    <template #trigger>
      <Button
        variant="ghost"
        size="icon"
        data-tour="notifications"
        class="relative size-9 text-muted-foreground"
        :aria-label="`${t('bell.label')} (${unread})`"
      >
        <Bell class="size-4" />
        <span
          v-if="unread > 0"
          data-slot="notification-badge"
          aria-hidden="true"
          class="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
        >
          {{ badge }}
        </span>
      </Button>
    </template>

    <div class="flex items-center justify-between border-b px-3 py-2">
      <p class="text-sm font-semibold">{{ t('bell.title') }}</p>
      <Button
        variant="ghost"
        size="sm"
        class="text-xs"
        data-bell-action="mark-all"
        :disabled="unread === 0 || markAll.isPending.value"
        @click="markAll.mutate()"
      >
        {{ t('actions.markAllRead') }}
      </Button>
    </div>

    <div v-if="items.length === 0" class="px-3 py-6 text-center">
      <p class="text-sm font-medium">{{ t('empty.title') }}</p>
      <p class="mt-1 text-xs text-muted-foreground">{{ t('empty.description') }}</p>
    </div>

    <ul v-else class="max-h-80 overflow-y-auto" role="menu" :aria-label="t('bell.title')">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          role="menuitem"
          data-bell-item
          class="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-accent/60"
          :class="item.read ? undefined : 'bg-primary/5'"
          @click="openItem(item)"
        >
          <span
            class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <component :is="notificationIcon(item.kind)" class="size-3.5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-medium">{{ notificationTitle(t, item) }}</span>
            <span class="block truncate text-[11px] text-muted-foreground">
              {{ notificationSummary(t, item) }}
            </span>
            <span class="mt-0.5 block text-[10px] text-muted-foreground">
              {{ relativeTime(item.createdAt) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <div class="border-t p-1">
      <Button
        variant="ghost"
        size="sm"
        class="w-full text-xs"
        data-bell-action="view-all"
        @click="viewAll"
      >
        {{ t('actions.viewAll') }}
      </Button>
    </div>
  </Popover>
</template>
