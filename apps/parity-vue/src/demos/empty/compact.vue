<script lang="ts">
export default { name: 'EmptyCompact' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Badge, Button, EmptyState, Input } from '@fish-admin/vue'
import { SearchX } from 'lucide-vue-next'

const EVENTS = [
  { title: 'Ada invited you to Apollo migration', meta: '2 hours ago' },
  { title: 'Grace requested access to Q3 roadmap', meta: 'Yesterday' },
  { title: 'Alan exported the audit log', meta: '3 days ago' },
]

const query = ref('')
const matches = computed(() =>
  EVENTS.filter((event) => event.title.toLowerCase().includes(query.value.trim().toLowerCase())),
)
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 460px">
    <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-bottom: 1px solid var(--border);
        "
      >
        <span style="font-size: 0.875rem; font-weight: 600">Activity</span>
        <Badge variant="secondary">{{ matches.length }} events</Badge>
      </div>
      <div style="padding: 0.75rem">
        <div style="width: 15rem; margin-bottom: 0.75rem">
          <Input v-model="query" placeholder="Filter activity" aria-label="Filter activity" />
        </div>
        <ul
          v-if="matches.length > 0"
          class="fish-demo-stack"
          style="gap: 0.5rem; margin: 0; padding: 0; list-style: none"
        >
          <li
            v-for="event in matches"
            :key="event.title"
            class="fish-demo-row"
            style="justify-content: space-between"
          >
            <span>{{ event.title }}</span>
            <span class="fish-demo-muted">{{ event.meta }}</span>
          </li>
        </ul>
        <EmptyState
          v-else
          class="py-8"
          :icon="SearchX"
          title="No matching activity"
          description="Nothing in the log matches the current filter."
        >
          <template #action>
            <Button size="sm" variant="outline" @click="query = ''">Clear filter</Button>
          </template>
        </EmptyState>
      </div>
    </div>
    <p class="fish-demo-muted">
      Type in the filter to empty the list; the compact empty state offers the way back.
    </p>
  </div>
</template>
