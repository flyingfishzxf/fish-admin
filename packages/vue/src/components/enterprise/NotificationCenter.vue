<script setup lang="ts">
import { Bell, type LucideIcon } from 'lucide-vue-next'
import { computed, useAttrs } from 'vue'

import { useUITranslation } from '../../i18n'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import Popover from './Popover.vue'

export interface NotificationItem {
  id: string
  title: string
  description?: string
  time: string
  read?: boolean
  icon?: LucideIcon
}

const props = withDefaults(
  defineProps<{
    /** Notifications to list, newest first. */
    items: NotificationItem[]
    /** Overrides the count derived from items; pass the server total. */
    unreadCount?: number
    /** Accessible name of the bell trigger; defaults to "Notifications". */
    ariaLabel?: string
    /** Panel heading; defaults to "Notifications". */
    title?: string
    /** Mark-all button text; defaults to "Mark all read". */
    markAllLabel?: string
    /** Text shown when items is empty; defaults to the caught-up line. */
    emptyLabel?: string
    /** Footer button text; defaults to "View all notifications". */
    viewAllLabel?: string
    class?: string
  }>(),
  {},
)

const attrs = useAttrs()
const { t } = useUITranslation()

const unread = computed(() => props.unreadCount ?? props.items.filter((item) => !item.read).length)
const label = computed(() => props.ariaLabel ?? t('enterprise.notifications'))
const triggerLabel = computed(() =>
  unread.value > 0
    ? t('enterprise.notificationsWithUnread', { label: label.value, count: unread.value })
    : label.value,
)
</script>

<template>
  <Popover align="end" class="w-80 max-w-[calc(100vw-2rem)] p-0 sm:w-96">
    <template #trigger>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        :aria-label="triggerLabel"
        data-slot="notification-center"
        :class="cn('relative', props.class)"
      >
        <Bell aria-hidden="true" class="size-4" />
        <span
          v-if="unread > 0"
          aria-hidden="true"
          class="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground"
        >
          {{ unread > 9 ? '9+' : unread }}
        </span>
      </Button>
    </template>
    <div class="flex items-center justify-between gap-3 border-b px-4 py-3">
      <p class="text-sm font-semibold">{{ props.title ?? t('enterprise.notifications') }}</p>
      <Button
        type="button"
        variant="link"
        size="xs"
        :disabled="unread === 0 || !attrs.onMarkAllRead"
        @click="(attrs.onMarkAllRead as () => void)?.()"
      >
        {{ props.markAllLabel ?? t('enterprise.markAllRead') }}
      </Button>
    </div>
    <div class="max-h-80 overflow-y-auto">
      <p
        v-if="props.items.length === 0"
        class="px-4 py-10 text-center text-sm text-muted-foreground"
      >
        {{ props.emptyLabel ?? t('enterprise.noNotifications') }}
      </p>
      <ul v-else>
        <li v-for="item in props.items" :key="item.id" class="border-b last:border-b-0">
          <button
            type="button"
            :class="
              cn(
                'flex w-full items-start gap-3 px-4 py-3 text-start transition-colors outline-none hover:bg-accent focus-visible:bg-accent',
                !item.read && 'bg-primary/5',
              )
            "
            @click="(attrs.onItemClick as (item: NotificationItem) => void)?.(item)"
          >
            <span
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <component :is="item.icon" v-if="item.icon" aria-hidden="true" class="size-4" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-start justify-between gap-2">
                <span class="text-sm font-medium">{{ item.title }}</span>
                <span
                  v-if="!item.read"
                  aria-hidden="true"
                  class="mt-1 size-1.5 shrink-0 rounded-full bg-primary"
                ></span>
              </span>
              <span v-if="item.description" class="mt-0.5 block text-xs text-muted-foreground">
                {{ item.description }}
              </span>
              <span class="mt-1 block text-[11px] text-muted-foreground">{{ item.time }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
    <div v-if="attrs.onViewAll" class="border-t p-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="w-full"
        @click="(attrs.onViewAll as () => void)?.()"
      >
        {{ props.viewAllLabel ?? t('enterprise.viewAllNotifications') }}
      </Button>
    </div>
  </Popover>
</template>
