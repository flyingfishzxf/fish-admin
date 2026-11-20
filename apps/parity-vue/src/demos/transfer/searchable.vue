<script lang="ts">
export default { name: 'TransferSearchable' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Transfer, type TransferItem } from '@fish-admin/vue'

const ITEMS: TransferItem[] = [
  {
    key: 'api',
    label: 'payments-api',
    description: 'Card authorisation service',
    group: 'Backend',
    searchText: 'stripe gateway',
  },
  {
    key: 'ledger',
    label: 'ledger-core',
    description: 'Double-entry bookkeeping',
    group: 'Backend',
    searchText: 'accounting journal',
  },
  {
    key: 'checkout-web',
    label: 'checkout-web',
    description: 'Customer checkout SPA',
    group: 'Frontend',
    searchText: 'react storefront',
  },
  {
    key: 'mobile',
    label: 'mobile-app',
    description: 'iOS and Android client',
    group: 'Frontend',
    searchText: 'react native phone',
  },
  {
    key: 'main',
    label: 'monorepo-main',
    description: 'Locked during the code freeze',
    group: 'Archives',
    disabled: true,
  },
]

const value = ref<string[]>(['api'])
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 40rem">
    <Transfer
      :items="ITEMS"
      :value="value"
      source-title="All repositories"
      target-title="Selected repositories"
      search-placeholder="Filter by name or stack"
      empty-source-label="No repositories match"
      empty-target-label="Nothing scoped in yet"
      aria-label="Scope repositories"
      @update:value="value = $event"
    />
    <p class="fish-demo-muted" style="margin: 0">
      Search matches <code>label</code>, <code>description</code> and <code>searchText</code>{' '}
      together; <code>Select all</code> only touches the filtered rows, and{' '}
      <code>monorepo-main</code> is <code>disabled</code> so it never moves.
    </p>
  </div>
</template>
