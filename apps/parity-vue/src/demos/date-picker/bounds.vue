<script lang="ts">
export default { name: 'DatePickerBounds' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DatePicker } from '@fish-admin/vue'

const MIN = '2026-10-01'
const MAX = '2026-12-31'

const value = ref<string | undefined>('2026-10-15')
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Access review date</p>
    <DatePicker
      :value="value"
      :min="MIN"
      :max="MAX"
      placeholder="Pick a date in Q4"
      ariaLabel="Access review date"
      class="fish-demo-w-72"
      @change="value = $event"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{ value ? `Review scheduled for ${value}.` : 'No review date selected.' }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      <code>min</code> and <code>max</code> are inclusive: every day before {{ MIN }} and after
      {{ MAX }} is a disabled day in the calendar, and the picker still opens on the selected month.
    </p>
  </div>
</template>
