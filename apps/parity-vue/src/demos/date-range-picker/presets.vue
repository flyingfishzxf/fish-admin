<script lang="ts">
export default { name: 'DateRangePickerPresets' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DateRangePicker, type DateRangePreset, type DateRangeValue } from '@fish-admin/vue'

const PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', from: '2026-10-21', to: '2026-10-27' },
  { label: 'Last 30 days', from: '2026-09-28', to: '2026-10-27' },
  { label: 'This quarter', from: '2026-10-01', to: '2026-10-27' },
]

const value = ref<DateRangeValue>({ from: '2026-09-28', to: '2026-10-27' })
</script>

<template>
  <div class="fish-demo-stack">
    <DateRangePicker
      v-model="value"
      placeholder="Select a range"
      ariaLabel="Audit log date range"
      :presets="PRESETS"
      class="fish-demo-w-72"
    />
    <p class="fish-demo-muted">Selected {{ value.from ?? '—' }} – {{ value.to ?? '—' }}</p>
  </div>
</template>
