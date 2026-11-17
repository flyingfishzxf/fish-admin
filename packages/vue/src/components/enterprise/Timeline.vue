<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'

export type TimelineTone = 'default' | 'info' | 'success' | 'warning' | 'destructive'

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp?: string
  icon?: Component
  tone?: TimelineTone
}

// Verbatim from the React timeline: the bubble carries the colour, the row
// carries the line, so a long list still reads as one thread.
const TONE_CLASSES: Record<TimelineTone, string> = {
  default: 'bg-muted text-muted-foreground',
  info: 'bg-chart-1/12 text-chart-1-foreground',
  success: 'bg-chart-3/14 text-chart-3-foreground',
  warning: 'bg-chart-4/16 text-chart-4-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

const props = withDefaults(
  defineProps<{
    items: TimelineItem[]
    /** Shown instead of the list when there is nothing to draw. */
    emptyLabel?: string
  }>(),
  { emptyLabel: undefined },
)

const rows = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    tone: item.tone ?? 'default',
    // The connector joins this row to the next one; the last row has no next.
    connected: index < props.items.length - 1,
  })),
)
</script>

<template>
  <p v-if="rows.length === 0" class="py-6 text-sm text-muted-foreground">
    {{ emptyLabel }}
  </p>
  <ol v-else class="space-y-0" data-slot="timeline">
    <li
      v-for="row in rows"
      :key="row.id"
      class="relative flex gap-3 pb-6 last:pb-0"
      data-slot="timeline-item"
    >
      <span
        v-if="row.connected"
        aria-hidden="true"
        class="absolute start-4 top-8 bottom-0 w-px bg-border"
      />
      <span
        class="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full"
        :class="TONE_CLASSES[row.tone]"
        data-slot="timeline-bubble"
      >
        <component :is="row.icon" v-if="row.icon" class="size-4" aria-hidden="true" />
        <span v-else class="size-2 rounded-full bg-current" />
      </span>
      <div class="min-w-0 flex-1 space-y-0.5 pt-0.5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium">{{ row.title }}</p>
          <span v-if="row.timestamp" class="text-xs text-muted-foreground">{{
            row.timestamp
          }}</span>
        </div>
        <p v-if="row.description" class="text-sm break-words text-muted-foreground">
          {{ row.description }}
        </p>
      </div>
    </li>
  </ol>
</template>
