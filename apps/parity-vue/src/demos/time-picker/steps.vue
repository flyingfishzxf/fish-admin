<script lang="ts">
export default { name: 'TimePickerSteps' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { TimePicker } from '@fish-admin/vue'

const value = ref<string | undefined>('14:20')
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Maintenance window</p>
    <TimePicker
      :value="value"
      :minute-step="15"
      placeholder="Pick a slot"
      ariaLabel="Maintenance window start"
      class="fish-demo-w-72"
      @change="value = $event"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{ value ? `Maintenance starts at ${value}.` : 'No maintenance slot chosen.' }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      With <code>minuteStep</code> set to 15, the MM column lists 00, 15, 30 and 45. Because the
      stored value is 14:20, the component still injects 20 into the list so nothing is lost when
      the popover opens.
    </p>
  </div>
</template>
