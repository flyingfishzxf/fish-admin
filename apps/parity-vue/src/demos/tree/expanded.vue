<script lang="ts">
export default { name: 'TreeExpanded' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, Tree, type TreeItem } from '@fish-admin/vue'

const ITEMS: TreeItem[] = [
  { id: 'eu-central', parentId: null, label: 'eu-central-1', description: 'Frankfurt, primary' },
  { id: 'eu-db', parentId: 'eu-central', label: 'Databases', badge: '12' },
  { id: 'eu-cache', parentId: 'eu-central', label: 'Cache clusters', badge: '4' },
  { id: 'us-east', parentId: null, label: 'us-east-1', description: 'N. Virginia, DR' },
  { id: 'us-db', parentId: 'us-east', label: 'Databases', badge: '3' },
  { id: 'us-legacy', parentId: 'us-east', label: 'Legacy instances', badge: '2' },
  { id: 'ap-south', parentId: null, label: 'ap-south-1', description: 'Mumbai, edge' },
]

const parentIds = ITEMS.filter((item) =>
  ITEMS.some((child) => child.parentId === item.id),
).map((item) => item.id)

const expandedIds = ref<ReadonlySet<string>>(new Set(['eu-central']))
const selectedId = ref<string | null>(null)

const openCount = computed(() => expandedIds.value.size)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="expandedIds = new Set(parentIds)"
      >
        Expand all
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        @click="expandedIds = new Set()"
      >
        Collapse all
      </Button>
    </div>
    <div
      style="
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--card);
        padding: 0.5rem;
      "
    >
      <Tree
        :items="ITEMS"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        ariaLabel="Datacenter regions"
        @select="selectedId = $event"
        @update:expandedIds="expandedIds = $event"
      />
    </div>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{ `${openCount} of ${parentIds.length} branches open` }}
      {{ selectedId ? ` · focused node: ${selectedId}` : '' }}. With `expandedIds` provided the
      tree stops expanding on its own, so <code>update:expandedIds</code> is the only way to
      update the set.
    </p>
  </div>
</template>
