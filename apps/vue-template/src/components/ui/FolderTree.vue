<script setup lang="ts">
import { Folder, FolderOpen } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '@fish-admin/vue'

import type { FileFolderSummary } from '../../features/files/api'
import { folderRows } from '../../features/files/folder-utils'

const props = defineProps<{
  folders: FileFolderSummary[]
  /** `undefined` means "All files" is the current scope. */
  selectedId?: string
  allLabel: string
  total: number
  emptyLabel: string
  ariaLabel: string
}>()

const emit = defineEmits<{ select: [id: string | undefined] }>()

const rows = computed(() => folderRows(props.folders))
</script>

<template>
  <nav :aria-label="ariaLabel" data-slot="folder-tree" class="space-y-1">
    <button
      type="button"
      data-folder-all
      :aria-current="!selectedId ? 'true' : undefined"
      :class="
        cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          !selectedId ? 'bg-secondary font-medium text-secondary-foreground' : 'hover:bg-muted',
        )
      "
      @click="emit('select', undefined)"
    >
      <FolderOpen class="size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate text-start">{{ allLabel }}</span>
      <span class="text-xs text-muted-foreground">{{ total }}</span>
    </button>

    <p v-if="rows.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
      {{ emptyLabel }}
    </p>

    <button
      v-for="row in rows"
      :key="row.id"
      type="button"
      :data-folder-id="row.id"
      :aria-current="selectedId === row.id ? 'true' : undefined"
      :class="
        cn(
          'flex w-full items-center gap-2 rounded-md py-1.5 pe-2 text-sm transition-colors',
          selectedId === row.id
            ? 'bg-secondary font-medium text-secondary-foreground'
            : 'hover:bg-muted',
        )
      "
      :style="{ paddingInlineStart: `${8 + row.depth * 14}px` }"
      @click="emit('select', row.id)"
    >
      <Folder class="size-4 shrink-0" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate text-start">{{ row.name }}</span>
      <span class="text-xs text-muted-foreground">{{ row.fileCount }}</span>
    </button>
  </nav>
</template>
