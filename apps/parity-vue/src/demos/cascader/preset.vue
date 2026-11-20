<script lang="ts">
export default { name: 'CascaderPreset' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Cascader, type CascaderOption } from '@fish-admin/vue'

const OPTIONS: CascaderOption[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'munich', label: 'Munich' },
        ],
      },
      {
        value: 'nordics',
        label: 'Nordics',
        children: [
          { value: 'stockholm', label: 'Stockholm' },
          { value: 'oslo', label: 'Oslo', disabled: true },
        ],
      },
    ],
  },
  {
    value: 'antarctica',
    label: 'Antarctica',
    disabled: true,
    children: [{ value: 'rothera', label: 'Rothera' }],
  },
]

const value = ref<string[]>(['europe', 'germany', 'berlin'])
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label">Cost center · pre-filled from the contract</p>
    <div class="fish-demo-w-72">
      <Cascader
        :options="OPTIONS"
        :value="value"
        placeholder="Select a cost center"
        ariaLabel="Cost center"
        @change="value = $event"
        @clear="value = []"
      />
    </div>
    <p class="fish-demo-muted">
      {{ value.length > 0 ? `Billing office: ${value.join(' / ')}` : 'Cleared — pick a branch again.' }}
    </p>
    <p class="fish-demo-muted">
      Oslo and the whole Antarctica branch are disabled; disabled nodes never commit a path.
    </p>
  </div>
</template>
