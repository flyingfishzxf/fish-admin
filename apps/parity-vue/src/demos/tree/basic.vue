<script lang="ts">
export default { name: 'TreeBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Tree, type TreeItem } from '@fish-admin/vue'
import { Building2, GitBranch, Globe, Users } from 'lucide-vue-next'

const ITEMS: TreeItem[] = [
  { id: 'acme', parentId: null, label: 'Acme Corporation', icon: Building2 },
  { id: 'engineering', parentId: 'acme', label: 'Engineering', badge: '18', icon: GitBranch },
  { id: 'platform', parentId: 'engineering', label: 'Platform', badge: '7' },
  { id: 'web', parentId: 'engineering', label: 'Web', badge: '6' },
  { id: 'infra', parentId: 'engineering', label: 'Infrastructure', badge: '5' },
  { id: 'design', parentId: 'acme', label: 'Design', badge: '4', icon: Globe },
  { id: 'operations', parentId: 'acme', label: 'Operations', badge: '9', icon: Users },
  { id: 'retired', parentId: 'acme', label: 'Legacy CRM', disabled: true },
]

const selectedId = ref<string | null>('platform')
const selected = computed(() => ITEMS.find((item) => item.id === selectedId.value))
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-muted" style="margin: 0">
      Focus a row, then use arrow keys to walk the hierarchy; Enter or Space selects it.
    </p>
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
        ariaLabel="Organization structure"
        empty-label="No departments configured"
        @select="selectedId = $event"
      />
    </div>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{ selected ? `Selected department: ${selected.label}.` : 'No department selected.' }}
    </p>
  </div>
</template>
