<script lang="ts">
export default { name: 'TreeSelectValidation' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { TreeSelect, type TreeItem } from '@fish-admin/vue'

const REGIONS: TreeItem[] = [
  { id: 'eu', parentId: null, label: 'Europe' },
  { id: 'eu-central', parentId: 'eu', label: 'eu-central-1 (Frankfurt)' },
  { id: 'eu-west', parentId: 'eu', label: 'eu-west-1 (Ireland)' },
  { id: 'us', parentId: null, label: 'United States' },
  { id: 'us-east', parentId: 'us', label: 'us-east-1 (N. Virginia)' },
]

const value = ref<string | null>(null)
const isMissing = computed(() => value.value === null)
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Deployment region (required)</p>
    <TreeSelect
      :items="REGIONS"
      :value="value"
      placeholder="Choose a region"
      ariaLabel="Deployment region"
      clearLabel="Clear deployment region"
      :aria-invalid="isMissing || undefined"
      :aria-describedby="isMissing ? 'region-error' : undefined"
      class="fish-demo-w-72"
      @change="value = $event"
      @clear="value = null"
    />
    <p
      v-if="isMissing"
      id="region-error"
      class="fish-demo-muted"
      style="color: var(--destructive); margin: 0"
    >
      Select a deployment region before saving.
    </p>
    <p v-else class="fish-demo-muted" style="margin: 0">
      Region accepted: <code>{{ value }}</code>.
    </p>
    <p class="fish-demo-label" style="margin: 0">Failover region (locked by policy)</p>
    <TreeSelect
      :items="REGIONS"
      value="us-east"
      placeholder="Choose a region"
      ariaLabel="Failover region"
      disabled
      class="fish-demo-w-72"
    />
  </div>
</template>
