<script lang="ts">
export default { name: 'DescriptionsBasic' }
</script>

<script setup lang="ts">
import { Descriptions, type DescriptionItem } from '@fish-admin/vue'

const ITEMS: DescriptionItem[] = [
  { term: 'Email', description: 'ada@example.com' },
  { term: 'Role', description: 'Workspace admin' },
  { term: 'Team', description: 'Platform' },
  { term: 'Joined', description: '2025-01-08' },
  { term: 'Last active', description: '2 hours ago', span: 2 },
]
</script>

<template>
  <div class="fish-demo-stack">
    <Descriptions :columns="2" :items="ITEMS" />
    <p class="fish-demo-muted" style="margin: 0">
      Terms are <code>dt</code> elements in 12 px muted text, values are <code>dd</code> elements
      at 14 px. The last item sets <code>span: 2</code> so it fills the row.
    </p>
  </div>
</template>
