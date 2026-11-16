<script setup lang="ts">
import type { WorkspaceFile } from '@fish-admin/contracts'
import { Badge, Button, Checkbox } from '@fish-admin/vue'
import { Lock, Star, Trash2 } from 'lucide-vue-next'

import { formatDate } from '../../lib/format'
import {
  fileExtension,
  fileIcon,
  formatFileSize,
  isPreviewable,
} from '../../features/files/file-meta'

const props = defineProps<{
  files: WorkspaceFile[]
  selectedId: string | null
  selectedIds: ReadonlySet<string>
  canManage: boolean
  language: string
  labels: {
    selectFile: (name: string) => string
    openFile: (name: string) => string
    favorite: (name: string) => string
    unfavorite: (name: string) => string
    delete: (name: string) => string
    private: string
    favoriteBadge: string
  }
}>()

const emit = defineEmits<{
  open: [file: WorkspaceFile]
  toggleSelected: [id: string, checked: boolean]
  toggleFavorite: [file: WorkspaceFile]
  remove: [file: WorkspaceFile]
}>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3" data-file-grid>
    <div
      v-for="file in props.files"
      :key="file.id"
      class="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-colors"
      :class="props.selectedId === file.id && 'border-primary ring-1 ring-primary/30'"
      :data-file-id="file.id"
      :data-selected="props.selectedId === file.id || undefined"
    >
      <div class="absolute start-2 top-2 z-10">
        <Checkbox
          :checked="props.selectedIds.has(file.id)"
          :aria-label="props.labels.selectFile(file.name)"
          class="bg-background/90"
          @update:modelValue="emit('toggleSelected', file.id, $event === true)"
        />
      </div>
      <Button
        v-if="props.canManage"
        type="button"
        variant="ghost"
        size="icon-sm"
        class="absolute end-1.5 top-1.5 z-10 bg-background/80 backdrop-blur"
        :aria-pressed="file.favorite"
        :aria-label="
          file.favorite ? props.labels.unfavorite(file.name) : props.labels.favorite(file.name)
        "
        :data-favorite="file.id"
        @click="emit('toggleFavorite', file)"
      >
        <Star
          class="size-4"
          :class="file.favorite && 'fill-warning text-warning'"
          aria-hidden="true"
        />
      </Button>

      <button
        type="button"
        class="flex flex-1 flex-col text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="emit('open', file)"
      >
        <span class="sr-only">{{ props.labels.openFile(file.name) }}</span>
        <span class="flex aspect-4/3 items-center justify-center overflow-hidden bg-muted/40">
          <img
            v-if="isPreviewable(file)"
            :src="file.dataUrl"
            alt=""
            class="size-full object-cover"
          />
          <component
            :is="fileIcon(file)"
            v-else
            class="size-10 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <span class="block space-y-1.5 p-3">
          <span :title="file.name" class="block truncate text-sm font-medium">{{ file.name }}</span>
          <span class="block truncate text-xs text-muted-foreground">
            {{ formatFileSize(file.size, props.language) }} ·
            {{
              formatDate(file.updatedAt, props.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            }}
          </span>
          <!-- One line, never wrapped: every card keeps the same text height. -->
          <span class="flex items-center gap-1">
            <Badge variant="outline">{{ fileExtension(file.name) }}</Badge>
            <Badge v-if="file.visibility === 'private'" variant="secondary">
              <Lock aria-hidden="true" />
              <span class="sr-only">{{ props.labels.private }}</span>
            </Badge>
            <Badge v-if="file.favorite" variant="secondary" class="text-warning">
              <Star class="fill-warning" aria-hidden="true" />
              <span class="sr-only">{{ props.labels.favoriteBadge }}</span>
            </Badge>
          </span>
        </span>
      </button>

      <div v-if="props.canManage" class="flex justify-end border-t px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :aria-label="props.labels.delete(file.name)"
          :data-delete="file.id"
          @click="emit('remove', file)"
        >
          <Trash2 class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </div>
</template>
