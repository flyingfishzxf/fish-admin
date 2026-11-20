<script lang="ts">
export default { name: 'NotificationCenterEmpty' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { NotificationCenter, type NotificationItem } from '@fish-admin/vue'
import { CheckCircle2 } from 'lucide-vue-next'

const READ_ITEMS: NotificationItem[] = [
  {
    id: 'sync',
    title: 'Directory sync finished',
    description: '1,204 accounts reviewed, 3 deactivated.',
    time: 'Monday',
    icon: CheckCircle2,
    read: true,
  },
  {
    id: 'keys',
    title: 'API keys rotated',
    description: 'The CI deploy key was replaced at 09:14.',
    time: 'Last week',
    icon: CheckCircle2,
    read: true,
  },
]

const status = ref('Pick a bell to inspect its panel.')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="align-items: flex-start">
      <div style="display: grid; gap: 0.375rem; justify-items: start">
        <span class="fish-demo-label">Empty inbox</span>
        <NotificationCenter
          :items="[]"
          aria-label="Support inbox"
          title="Support inbox"
          mark-all-label="Mark all read"
          empty-label="No support notifications yet."
          @mark-all-read="status = 'Nothing to mark — the support inbox is empty.'"
          @view-all="status = 'View all — open the support inbox.'"
          view-all-label="Open support inbox"
        />
      </div>
      <div style="display: grid; gap: 0.375rem; justify-items: start">
        <span class="fish-demo-label">Everything read</span>
        <NotificationCenter
          :items="READ_ITEMS"
          aria-label="Release inbox"
          title="Release inbox"
          mark-all-label="Mark all read"
          empty-label="No release notifications yet."
          @mark-all-read="status = 'All release notifications are already read.'"
        />
      </div>
    </div>
    <p class="fish-demo-muted" aria-live="polite">{{ status }}</p>
    <p class="fish-demo-muted">
      With no unread items the badge disappears and “Mark all read” is disabled.
    </p>
  </div>
</template>
