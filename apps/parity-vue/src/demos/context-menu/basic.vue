<script lang="ts">
export default { name: 'ContextMenuBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ContextMenu, type ContextMenuEntry } from '@fish-admin/vue'
import { Archive, Copy, ExternalLink, FolderInput } from 'lucide-vue-next'

const lastAction = ref('No action yet')

const ITEMS: ContextMenuEntry[] = [
  { id: 'label', kind: 'label', label: 'Apollo migration' },
  {
    id: 'open',
    label: 'Open project',
    icon: ExternalLink,
    onSelect: () => (lastAction.value = 'Opened Apollo migration'),
  },
  {
    id: 'copy',
    label: 'Copy link',
    icon: Copy,
    onSelect: () => (lastAction.value = 'Copied the project link'),
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: FolderInput,
    onSelect: () => (lastAction.value = 'Duplicated Apollo migration'),
  },
  { id: 'sep', kind: 'separator' },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    onSelect: () => (lastAction.value = 'Archived Apollo migration'),
  },
]
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <p class="fish-demo-muted">
      Right-click the card — or long-press it on touch — to open its menu.
    </p>
    <ContextMenu :items="ITEMS">
      <template #trigger>
        <div
          style="
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.875rem 1rem;
            background-color: var(--card);
            cursor: context-menu;
          "
        >
          <p style="margin: 0; font-size: 0.875rem; font-weight: 600">Apollo migration</p>
          <p class="fish-demo-muted" style="margin: 0.25rem 0 0">Updated 2 hours ago · 8 members</p>
        </div>
      </template>
    </ContextMenu>
    <p class="fish-demo-muted">Last action: {{ lastAction }}</p>
  </div>
</template>
