<script lang="ts">
export default { name: 'ScrollAreaVisibility' }
</script>

<script setup lang="ts">
const ROWS = [
  'Round-robin assignment',
  'Auto-close after 7 days',
  'Escalate on first reply',
  'Require a resolution note',
  'Notify the on-call channel',
  'Sync status to Linear',
  'Archive empty queues',
]
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 32rem">
    <div class="fish-demo-row" style="align-items: flex-start">
      <div style="display: grid; gap: 0.375rem">
        <span class="fish-demo-label">Vertical</span>
        <ScrollArea
          class="h-[132px] w-[200px] rounded-lg"
          style="border: 1px solid var(--border); border-radius: 0.5rem"
        >
          <ul style="margin: 0; padding: 0.5rem 1.25rem; font-size: 0.78rem">
            <li v-for="row in ROWS" :key="row" style="padding: 0.2rem 0">{{ row }}</li>
          </ul>
        </ScrollArea>
      </div>
      <div style="display: grid; gap: 0.375rem">
        <span class="fish-demo-label">Horizontal</span>
        <ScrollArea
          orientation="horizontal"
          class="h-[132px] w-[200px] rounded-lg"
          style="border: 1px solid var(--border); border-radius: 0.5rem"
        >
          <div style="display: flex; gap: 0.75rem; padding: 0.5rem 1.25rem; width: max-content">
            <span
              v-for="(row, index) in ROWS"
              :key="row"
              style="font-size: 0.78rem; white-space: nowrap"
            >
              {{ index + 1 }} · {{ row }}
            </span>
          </div>
        </ScrollArea>
      </div>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      The scrollbar appears on scroll by default; the Vue surface currently exposes the orientation
      switch instead of a visibility mode.
    </p>
  </div>
</template>
