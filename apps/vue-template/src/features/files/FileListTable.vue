<script setup lang="ts">
import type { WorkspaceFile } from '@fish-admin/contracts'
import { Badge, Button, Checkbox } from '@fish-admin/vue'
import { Lock, Star, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

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
    selectAll: string
    selectFile: (name: string) => string
    openFile: (name: string) => string
    favorite: (name: string) => string
    unfavorite: (name: string) => string
    delete: (name: string) => string
    private: string
    team: string
    name: string
    type: string
    size: string
    visibility: string
    updated: string
    actions: string
  }
}>()

const emit = defineEmits<{
  open: [file: WorkspaceFile]
  toggleSelected: [id: string, checked: boolean]
  toggleAll: [checked: boolean]
  toggleFavorite: [file: WorkspaceFile]
  remove: [file: WorkspaceFile]
}>()

const allSelected = computed(
  () => props.files.length > 0 && props.files.every((file) => props.selectedIds.has(file.id)),
)
const someSelected = computed(() => props.files.some((file) => props.selectedIds.has(file.id)))
const headerState = computed<boolean | 'indeterminate'>(() =>
  allSelected.value ? true : someSelected.value ? 'indeterminate' : false,
)
</script>

<template>
  <div class="overflow-x-auto rounded-lg border" data-file-table>
    <table class="w-full text-sm">
      <thead class="bg-muted/40 text-xs text-muted-foreground">
        <tr>
          <th class="w-10 px-2 py-2">
            <Checkbox
              :model-value="headerState"
              :aria-label="props.labels.selectAll"
              data-select-all
              @update:modelValue="emit('toggleAll', $event === true)"
            />
          </th>
          <th class="px-2 py-2 text-start font-medium">{{ props.labels.name }}</th>
          <th class="hidden px-2 py-2 text-start font-medium sm:table-cell">
            {{ props.labels.type }}
          </th>
          <th class="hidden px-2 py-2 text-start font-medium md:table-cell">
            {{ props.labels.size }}
          </th>
          <th class="hidden px-2 py-2 text-start font-medium lg:table-cell">
            {{ props.labels.visibility }}
          </th>
          <th class="hidden px-2 py-2 text-start font-medium xl:table-cell">
            {{ props.labels.updated }}
          </th>
          <th class="px-2 py-2 text-end font-medium">{{ props.labels.actions }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="file in props.files"
          :key="file.id"
          class="border-t transition-colors hover:bg-muted/50"
          :class="props.selectedId === file.id && 'bg-muted/60'"
          :data-file-id="file.id"
          :data-selected="props.selectedId === file.id || undefined"
        >
          <td class="px-2 py-2">
            <Checkbox
              :model-value="props.selectedIds.has(file.id)"
              :aria-label="props.labels.selectFile(file.name)"
              @update:modelValue="emit('toggleSelected', file.id, $event === true)"
            />
          </td>
          <td class="px-2 py-2">
            <button
              type="button"
              class="flex w-full max-w-64 min-w-0 items-center gap-2 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              :class="props.selectedId === file.id && 'font-medium'"
              @click="emit('open', file)"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
              >
                <img
                  v-if="isPreviewable(file)"
                  :src="file.dataUrl"
                  alt=""
                  class="size-full object-cover"
                />
                <component
                  :is="fileIcon(file)"
                  v-else
                  class="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <span :title="file.name" class="min-w-0 flex-1 truncate">{{ file.name }}</span>
            </button>
          </td>
          <td class="hidden px-2 py-2 sm:table-cell">
            <Badge variant="outline">{{ fileExtension(file.name) }}</Badge>
          </td>
          <td class="hidden px-2 py-2 text-muted-foreground md:table-cell">
            {{ formatFileSize(file.size, props.language) }}
          </td>
          <td class="hidden px-2 py-2 lg:table-cell">
            <Badge variant="secondary">
              <Lock v-if="file.visibility === 'private'" aria-hidden="true" />
              {{ file.visibility === 'private' ? props.labels.private : props.labels.team }}
            </Badge>
          </td>
          <td class="hidden px-2 py-2 text-muted-foreground xl:table-cell">
            {{
              formatDate(file.updatedAt, props.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            }}
          </td>
          <td class="px-2 py-2">
            <div class="flex justify-end gap-1">
              <Button
                v-if="props.canManage"
                type="button"
                variant="ghost"
                size="icon-sm"
                :aria-pressed="file.favorite"
                :aria-label="
                  file.favorite
                    ? props.labels.unfavorite(file.name)
                    : props.labels.favorite(file.name)
                "
                @click="emit('toggleFavorite', file)"
              >
                <Star
                  class="size-4"
                  :class="file.favorite && 'fill-warning text-warning'"
                  aria-hidden="true"
                />
              </Button>
              <Button
                v-if="props.canManage"
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
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
