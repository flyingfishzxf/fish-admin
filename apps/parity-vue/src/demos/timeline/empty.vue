<script lang="ts">
export default { name: 'TimelineEmpty' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Timeline, type TimelineItem } from '@fish-admin/vue'

const EVENTS: TimelineItem[] = [
  {
    id: 'created',
    title: 'Workflow submitted',
    description: 'Request WF-2026-0142 was opened by Katherine.',
    timestamp: 'Just now',
  },
  {
    id: 'review',
    title: 'Sent for review',
    description: 'Routed to the platform approvers group.',
    timestamp: '1 minute ago',
    tone: 'info',
  },
]

const items = ref<TimelineItem[]>(EVENTS)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button type="button" variant="outline" size="sm" @click="items = items.length ? [] : EVENTS">
        {{ items.length ? 'Clear events' : 'Reload events' }}
      </Button>
    </div>
    <Timeline :items="items" empty-label="No audit events yet." />
    <p class="fish-demo-muted" style="margin: 0">
      When <code>items</code> is empty the list collapses entirely. With an{' '}
      <code>emptyLabel</code> you get a muted placeholder line; without one, the component renders
      nothing.
    </p>
  </div>
</template>
