<script lang="ts">
export default { name: 'ListBasic' }
</script>

<script setup lang="ts">
import { List, type ListItem } from '@fish-admin/vue'
import { FileUp, Rocket, ShieldCheck } from 'lucide-vue-next'

const ACTIVITY: ListItem[] = [
  {
    id: 'deploy',
    title: 'Production deploy finished',
    description: 'Build 4812 · 42 seconds',
    meta: '2m ago',
    icon: Rocket,
  },
  {
    id: 'review',
    title: 'Access review completed',
    description: '12 of 240 role assignments changed',
    meta: '1h ago',
    icon: ShieldCheck,
  },
  {
    id: 'export',
    title: 'Invoice batch exported',
    description: 'September · 248 invoices',
    meta: 'Yesterday',
    icon: FileUp,
  },
]
</script>

<template>
  <div class="fish-demo-stack">
    <List :items="ACTIVITY" ariaLabel="Workspace activity" empty-label="No activity yet." />
    <p class="fish-demo-muted">
      Without a row-click handler the rows are plain text: no hover, no focus, no selection.
    </p>
  </div>
</template>
