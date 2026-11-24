<script lang="ts">
export default { name: 'TrendBasic' }
</script>

<script setup lang="ts">
import { Trend } from '@fish-admin/vue'

const ROWS = [
  { key: 'revenue', name: 'Monthly revenue', value: 12.4, label: 'vs last month', precision: 1 },
  { key: 'churn', name: 'Customer churn', value: -0.6, label: 'vs last month', precision: 1 },
  { key: 'active-users', name: 'Active users', value: 0, label: 'vs last week', precision: 1 },
  { key: 'latency', name: 'p95 latency', value: 8.02, label: 'vs last week', precision: 2 },
]
</script>

<template>
  <div class="fish-demo-stack">
    <div
      v-for="row in ROWS"
      :key="row.key"
      class="fish-demo-row"
      style="justify-content: space-between"
    >
      <span class="fish-demo-label">{{ row.name }}</span>
      <Trend :value="row.value" :label="row.label" :precision="row.precision" />
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      Positive values get <code>ArrowUpRight</code> in <code>text-success</code>, negative ones{' '}
      <code>ArrowDownRight</code> in <code>text-destructive</code>, and <code>0</code> a muted flat
      dash — the sign is always part of the text.
    </p>
  </div>
</template>
