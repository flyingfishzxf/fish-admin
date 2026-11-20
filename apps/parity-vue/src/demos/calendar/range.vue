<script lang="ts">
export default { name: 'CalendarRange' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, Card, DateRangePicker, type DateRangeValue } from '@fish-admin/vue'

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

function addDays(iso: string, days: number) {
  const next = new Date(iso)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

// Seed a three-night window so the preview opens in a useful state.
const today = new Date().toISOString().slice(0, 10)
const range = ref<DateRangeValue>({ from: today, to: addDays(today, 3) })

const nights = computed(() =>
  range.value.from && range.value.to
    ? Math.round(
        (new Date(range.value.to).getTime() - new Date(range.value.from).getTime()) /
          (24 * 60 * 60 * 1000),
      )
    : 0,
)
</script>

<template>
  <div class="fish-demo-stack">
    <!-- The Vue package ships range selection through DateRangePicker; the
         calendar component itself is single-date. -->
    <Card class="w-fit">
      <DateRangePicker
        v-model="range"
        placeholder="Pick a maintenance window"
        ariaLabel="Maintenance window"
      />
    </Card>
    <div class="fish-demo-row">
      <span class="fish-demo-muted" aria-live="polite">
        {{
          range.from
            ? `${DATE_FORMAT.format(new Date(range.from))} → ${range.to ? DATE_FORMAT.format(new Date(range.to)) : 'pick an end date'}${nights > 0 ? ` (${nights} nights)` : ''}`
            : 'No maintenance window selected.'
        }}
      </span>
      <Button variant="outline" size="sm" @click="range = { from: undefined, to: undefined }">
        Clear
      </Button>
    </div>
  </div>
</template>
