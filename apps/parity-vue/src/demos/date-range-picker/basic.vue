<script lang="ts">
export default { name: 'DateRangePickerBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { DateRangePicker, type DateRangeValue } from '@fish-admin/vue'

const value = ref<DateRangeValue>({})
</script>

<template>
  <div class="fish-demo-stack">
    <DateRangePicker
      v-model="value"
      placeholder="Filter by date"
      ariaLabel="Report date range"
      class="fish-demo-w-72"
    />
    <p class="fish-demo-muted">From {{ value.from ?? '—' }} to {{ value.to ?? '—' }}</p>
  </div>
</template>
