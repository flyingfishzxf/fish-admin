<script lang="ts">
export default { name: 'NotificationCenterBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { NotificationCenter, type NotificationItem } from '@fish-admin/vue'
import { FileText, Rocket, UserPlus } from 'lucide-vue-next'

const items = ref<NotificationItem[]>([
  {
    id: 'invite',
    title: 'Invite accepted',
    description: 'Grace Hopper joined the Platform team.',
    time: '2 minutes ago',
    icon: UserPlus,
  },
  {
    id: 'deploy',
    title: 'Deploy to production finished',
    description: 'Build 4812 shipped in 42 seconds.',
    time: '1 hour ago',
    icon: Rocket,
  },
  {
    id: 'report',
    title: 'October usage report is ready',
    description: '240 seats active, 12 invitations pending.',
    time: 'Yesterday',
    icon: FileText,
    read: true,
  },
])

const status = ref('Inbox has 2 unread notifications.')

const unread = computed(() => items.value.filter((item) => !item.read).length)

function onItemClick(item: NotificationItem) {
  items.value = items.value.map((entry) =>
    entry.id === item.id ? { ...entry, read: true } : entry,
  )
  status.value = `Opened “${item.title}”.`
}

function onMarkAllRead() {
  items.value = items.value.map((entry) => ({ ...entry, read: true }))
  status.value = 'All notifications marked read.'
}
</script>

<template>
  <div class="fish-demo-row" style="align-items: flex-start">
    <NotificationCenter
      :items="items"
      aria-label="Notifications"
      title="Notifications"
      mark-all-label="Mark all read"
      empty-label="You're all caught up."
      view-all-label="View all notifications"
      @item-click="onItemClick"
      @mark-all-read="onMarkAllRead"
      @view-all="status = 'View all — navigate to the notification inbox.'"
    />
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0; max-width: 18rem">
      {{ status }} Unread badge now reports {{ unread }}.
    </p>
  </div>
</template>
