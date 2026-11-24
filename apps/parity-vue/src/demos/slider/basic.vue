<script lang="ts">
export default { name: 'SliderBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Slider } from '@fish-admin/vue'

const budget = ref(1800)
const formatted = computed(() => `$${budget.value.toLocaleString('en-US')}`)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between; width: 300px">
      <span class="fish-demo-label">Monthly infrastructure budget</span>
      <span style="font-variant-numeric: tabular-nums; font-weight: 500">{{ formatted }}</span>
    </div>
    <div style="width: 300px">
      <Slider
        v-model="budget"
        :min="200"
        :max="5000"
        :step="100"
        aria-label="Monthly infrastructure budget"
      />
    </div>
    <p class="fish-demo-muted" style="margin: 0; max-width: 300px">
      Alerts fire at 80% of the selected budget. Steps of $100 between $200 and $5,000.
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      The slider is controlled: the readout above tracks the thumb while you drag or use the arrow
      keys.
    </p>
  </div>
</template>
