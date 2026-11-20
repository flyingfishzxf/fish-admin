<script lang="ts">
export default { name: 'TimePickerBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { TimePicker } from '@fish-admin/vue'

const value = ref<string | undefined>('09:00')
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Daily standup start</p>
    <TimePicker
      :value="value"
      placeholder="Pick a time"
      ariaLabel="Standup start time"
      class="fish-demo-w-72"
      @change="value = $event"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{ value ? `Standup begins at ${value} (24-hour HH:mm).` : 'No standup time set.' }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      The popover holds two selects, HH and MM. Changing either calls <code>change</code>{' '}
      immediately; <code>Clear</code> in the footer resets to an empty value.
    </p>
  </div>
</template>
