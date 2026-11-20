<script lang="ts">
export default { name: 'DatePickerBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DatePicker } from '@fish-admin/vue'

const value = ref<string | undefined>('2026-11-03')
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Migration window opens</p>
    <DatePicker
      :value="value"
      placeholder="Pick a date"
      ariaLabel="Migration start date"
      class="fish-demo-w-72"
      @change="value = $event"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{
        value
          ? `Freeze deployments on ${value}. The value is a YYYY-MM-DD string, not a Date.`
          : 'No freeze date scheduled.'
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      Choosing a day stores it and closes the popover; <code>Clear</code> in the footer calls
      <code>change(undefined)</code>.
    </p>
  </div>
</template>
