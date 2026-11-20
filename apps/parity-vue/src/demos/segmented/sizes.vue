<script lang="ts">
export default { name: 'SegmentedSizes' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Segmented } from '@fish-admin/vue'

const period = ref('monthly')
const layout = ref('grid')
</script>

<template>
  <div class="fish-demo-stack">
    <div style="display: grid; gap: 0.375rem">
      <span class="fish-demo-label">Default size</span>
      <Segmented
        aria-label="Billing period"
        v-model="period"
        :options="[
          { value: 'monthly', label: 'Monthly' },
          { value: 'annual', label: 'Annual' },
          { value: 'lifetime', label: 'Lifetime', disabled: true },
        ]"
      />
    </div>
    <div style="display: grid; gap: 0.375rem">
      <span class="fish-demo-label">Small size</span>
      <Segmented
        aria-label="Report layout"
        size="sm"
        v-model="layout"
        :options="[
          { value: 'grid', label: 'Grid' },
          { value: 'list', label: 'List' },
          { value: 'board', label: 'Board', disabled: true },
        ]"
      />
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        period === 'monthly'
          ? 'Monthly billing renews on the 1st.'
          : 'Annual billing includes two months free.'
      }}
      Layout: {{ layout }}. Lifetime and board stay disabled until the plan changes.
    </p>
  </div>
</template>
