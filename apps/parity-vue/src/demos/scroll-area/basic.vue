<script lang="ts">
export default { name: 'ScrollAreaBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, ScrollArea } from '@fish-admin/vue'

const EVENTS = [
  {
    id: 'e1',
    title: 'Report exported',
    detail: 'Q3 revenue by region · 1.2 MB CSV',
    time: '09:41',
  },
  { id: 'e2', title: 'Member invited', detail: 'new.teammate@acme.dev · Design', time: '09:12' },
  {
    id: 'e3',
    title: 'Webhook retried',
    detail: 'Endpoint billing-sync · attempt 2',
    time: '08:55',
  },
  {
    id: 'e4',
    title: 'API key rotated',
    detail: 'Production key · expires in 90 days',
    time: '08:20',
  },
  {
    id: 'e5',
    title: 'Plan changed',
    detail: 'Team → Business · prorated invoice',
    time: 'Yesterday',
  },
  {
    id: 'e6',
    title: 'Audit log purge',
    detail: 'Entries older than 180 days removed',
    time: 'Yesterday',
  },
  {
    id: 'e7',
    title: 'Backup completed',
    detail: 'eu-central-1 · 42 GB snapshot',
    time: '2 days ago',
  },
]

const unread = ref(['e1', 'e2', 'e3'])

function markRead(id: string) {
  unread.value = unread.value.filter((entry) => entry !== id)
}
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 30rem">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem">
      <div>
        <p style="margin: 0; font-size: 0.875rem; font-weight: 600">Workspace activity</p>
        <p class="fish-demo-muted" style="margin: 0">
          {{
            unread.length === 0 ? 'All caught up' : `${unread.length} unread of ${EVENTS.length}`
          }}
        </p>
      </div>
      <Button variant="outline" size="sm" :disabled="unread.length === 0" @click="unread = []">
        Mark all read
      </Button>
    </div>
    <ScrollArea
      class="h-[200px] rounded-lg"
      style="border: 1px solid var(--border); border-radius: 0.5rem"
    >
      <ul style="margin: 0; padding: 0; list-style: none">
        <li
          v-for="(event, index) in EVENTS"
          :key="event.id"
          :style="{ borderTop: index === 0 ? 'none' : '1px solid var(--border)' }"
        >
          <button
            type="button"
            style="
              display: grid;
              gap: 0.125rem;
              width: 100%;
              padding: 0.5rem 1.25rem 0.5rem 0.75rem;
              text-align: left;
              font: inherit;
              color: inherit;
              cursor: pointer;
              background: transparent;
              border: none;
            "
            @click="markRead(event.id)"
          >
            <span style="display: flex; align-items: center; gap: 0.5rem">
              <span
                aria-hidden="true"
                :style="{
                  width: '6px',
                  height: '6px',
                  flexShrink: 0,
                  borderRadius: '999px',
                  background: unread.includes(event.id) ? 'var(--primary)' : 'transparent',
                  border: unread.includes(event.id) ? 'none' : '1px solid var(--border)',
                }"
              />
              <span
                :style="{
                  fontSize: '0.8rem',
                  fontWeight: unread.includes(event.id) ? 600 : 400,
                }"
              >
                {{ event.title }}
              </span>
              <span class="fish-demo-muted" style="margin-left: auto; font-size: 0.75rem">
                {{ event.time }}
              </span>
            </span>
            <span class="fish-demo-muted" style="font-size: 0.78rem">{{ event.detail }}</span>
          </button>
        </li>
      </ul>
    </ScrollArea>
    <p class="fish-demo-muted" style="margin: 0">
      Click an entry to mark it read; the scrollbar appears only while the list scrolls.
    </p>
  </div>
</template>
