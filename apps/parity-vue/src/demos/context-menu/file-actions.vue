<script lang="ts">
export default { name: 'ContextMenuFileActions' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { ContextMenu, type ContextMenuEntry } from '@fish-admin/vue'
import {
  Download,
  Eye,
  FileText,
  FolderClosed,
  FolderInput,
  Pencil,
  Star,
  Trash2,
} from 'lucide-vue-next'

const FILES = [
  { name: 'Q3-roadmap.pdf', meta: '2.4 MB · Product' },
  { name: 'design-system.fig', meta: '18.1 MB · Design' },
]

const FOLDERS = ['Product', 'Design', 'Archive']

const pinned = ref<string[]>([])
const status = ref('No action yet')

function togglePinned(name: string) {
  const wasPinned = pinned.value.includes(name)
  pinned.value = wasPinned
    ? pinned.value.filter((entry) => entry !== name)
    : [...pinned.value, name]
  status.value = `${wasPinned ? 'Unpinned' : 'Pinned'} ${name}`
}

function itemsFor(file: string): ContextMenuEntry[] {
  return [
    { id: 'label', kind: 'label', label: file },
    { id: 'open', label: 'Open', icon: Eye, onSelect: () => (status.value = `Opened ${file}`) },
    {
      id: 'download',
      label: 'Download',
      icon: Download,
      onSelect: () => (status.value = `Downloaded ${file}`),
    },
    {
      id: 'move',
      kind: 'sub',
      label: 'Move to',
      icon: FolderInput,
      children: FOLDERS.map((folder) => ({
        id: folder,
        label: folder,
        icon: FolderClosed,
        onSelect: () => (status.value = `Moved ${file} to ${folder}`),
      })),
    },
    { id: 'sep-1', kind: 'separator' },
    {
      id: 'pin',
      label: pinned.value.includes(file) ? 'Unpin from favorites' : 'Pin to favorites',
      icon: Star,
      onSelect: () => togglePinned(file),
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: Pencil,
      onSelect: () => (status.value = `Renaming ${file}`),
    },
    { id: 'sep-2', kind: 'separator' },
    { id: 'delete', label: 'Delete', icon: Trash2, disabled: true, destructive: true },
  ]
}

const anyPinned = computed(() => pinned.value.length > 0)
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 460px">
    <p class="fish-demo-muted">
      Right-click a file row to open its menu: two actions, a Move to submenu, a pin toggle and a
      disabled Delete.
    </p>
    <div class="fish-demo-stack" style="gap: 0.5rem">
      <ContextMenu v-for="file in FILES" :key="file.name" :items="itemsFor(file.name)">
        <template #trigger>
          <div
            style="
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem 0.625rem;
              border: 1px solid var(--border);
              border-radius: 6px;
              background-color: var(--background);
              cursor: context-menu;
            "
          >
            <FileText
              aria-hidden="true"
              :size="16"
              style="color: var(--muted-foreground)"
            />
            <div style="min-width: 0; flex: 1">
              <p style="margin: 0; font-size: 0.875rem">{{ file.name }}</p>
              <p class="fish-demo-muted" style="margin: 0">{{ file.meta }}</p>
            </div>
            <Star
              v-if="pinned.includes(file.name)"
              aria-hidden="true"
              :size="14"
              style="color: var(--muted-foreground)"
            />
          </div>
        </template>
      </ContextMenu>
    </div>
    <p class="fish-demo-muted">
      Delete stays disabled because this account is not the file owner. Last action:
      {{ status }}{{ anyPinned ? '' : '' }}.
    </p>
  </div>
</template>
