<script lang="ts">
export default { name: 'TreeSelectBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { TreeSelect, type TreeItem } from '@fish-admin/vue'

const ITEMS: TreeItem[] = [
  { id: 'engineering', parentId: null, label: 'Engineering' },
  { id: 'platform', parentId: 'engineering', label: 'Platform' },
  { id: 'frontend', parentId: 'engineering', label: 'Frontend' },
  { id: 'design', parentId: null, label: 'Design' },
  { id: 'product', parentId: null, label: 'Product' },
]

const value = ref<string | null>('frontend')
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Owning team</p>
    <TreeSelect
      :items="ITEMS"
      :value="value"
      placeholder="Choose a team"
      ariaLabel="Owning team"
      clearLabel="Clear owning team"
      emptyLabel="No teams configured"
      class="fish-demo-w-72"
      @change="value = $event"
      @clear="value = null"
    />
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{
        value
          ? `Stored value is the node id "${value}"; the trigger shows its path, e.g. Engineering / Frontend.`
          : 'No team selected — the trigger is back to the placeholder.'
      }}
    </p>
  </div>
</template>
