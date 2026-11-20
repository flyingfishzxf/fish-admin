<script lang="ts">
export default { name: 'TransferBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Transfer, type TransferItem } from '@fish-admin/vue'

const ITEMS: TransferItem[] = [
  { key: 'ada', label: 'Ada Lovelace', description: 'Analytics' },
  { key: 'grace', label: 'Grace Hopper', description: 'Platform' },
  { key: 'katherine', label: 'Katherine Johnson', description: 'Simulation' },
  { key: 'linus', label: 'Linus Torvalds', description: 'Kernel' },
  { key: 'margaret', label: 'Margaret Hamilton', description: 'Flight software' },
]

const value = ref<string[]>(['grace'])
const summary = computed(
  () =>
    `${value.value.length} of ${ITEMS.length} members assigned. ${
      value.value.length > 0
        ? `Keys in value: ${value.value.join(', ')}.`
        : 'The value is an empty array.'
    }`,
)
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 40rem">
    <Transfer
      :items="ITEMS"
      :value="value"
      source-title="Team members"
      target-title="Reviewers"
      empty-source-label="Everyone is assigned"
      empty-target-label="No reviewers yet"
      aria-label="Assign reviewers"
      @update:value="value = $event"
    />
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">{{ summary }}</p>
  </div>
</template>
