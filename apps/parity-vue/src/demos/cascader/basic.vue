<script lang="ts">
export default { name: 'CascaderBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Cascader, type CascaderOption } from '@fish-admin/vue'

const OPTIONS: CascaderOption[] = [
  {
    value: 'americas',
    label: 'Americas',
    children: [
      {
        value: 'us',
        label: 'United States',
        children: [
          { value: 'california', label: 'California' },
          { value: 'new-york', label: 'New York' },
          { value: 'texas', label: 'Texas' },
        ],
      },
      {
        value: 'canada',
        label: 'Canada',
        children: [
          { value: 'ontario', label: 'Ontario' },
          { value: 'quebec', label: 'Quebec' },
        ],
      },
    ],
  },
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'bavaria', label: 'Bavaria' },
        ],
      },
      {
        value: 'france',
        label: 'France',
        children: [{ value: 'paris', label: 'Paris' }],
      },
    ],
  },
  {
    value: 'apac',
    label: 'Asia Pacific',
    children: [
      {
        value: 'japan',
        label: 'Japan',
        children: [{ value: 'tokyo', label: 'Tokyo' }],
      },
      {
        value: 'singapore',
        label: 'Singapore',
        children: [{ value: 'central', label: 'Central' }],
      },
    ],
  },
]

const value = ref<string[]>([])
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label">Office location</p>
    <div class="fish-demo-w-72">
      <Cascader
        :options="OPTIONS"
        :value="value"
        placeholder="Select a region, country and office"
        ariaLabel="Office location"
        empty-label="No regions configured"
        @change="value = $event"
        @clear="value = []"
      />
    </div>
    <p class="fish-demo-muted">
      {{ value.length > 0 ? `Saved path: ${value.join(' / ')}` : 'Nothing selected yet.' }}
    </p>
  </div>
</template>
