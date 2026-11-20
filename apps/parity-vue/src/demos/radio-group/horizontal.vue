<script lang="ts">
export default { name: 'RadioGroupHorizontal' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { RadioGroup } from '@fish-admin/vue'

const CADENCES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly', disabled: true },
]

const cadence = ref('weekly')
</script>

<template>
  <div class="fish-demo-stack">
    <span id="demo-radio-cadence-label" class="fish-demo-label">Digest cadence</span>
    <RadioGroup v-model="cadence" :options="CADENCES" aria-label="Digest cadence" />
    <p id="demo-radio-cadence-monthly-note" class="fish-demo-muted">
      Monthly is disabled until the workspace has three months of history.
    </p>
    <p class="fish-demo-muted" aria-live="polite">Sending {{ cadence }}.</p>
  </div>
</template>
