<script setup lang="ts">
import type { WorkspaceFile } from '@fish-admin/contracts'
import {
  AlertDialog,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@fish-admin/vue'
import { File, Pencil, Star, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { formatDate } from '../../lib/format'
import { useT } from '../../lib/i18n'
import { fileIcon, formatFileSize, isPreviewable } from './file-meta'
import { flattenFolders, folderPathLabel } from './folder-utils'
import type { FileFolderSummary } from './api'

const props = defineProps<{
  file: WorkspaceFile | null
  images: WorkspaceFile[]
  folders: FileFolderSummary[]
  language: string
  canManage: boolean
  deleting?: boolean
  onToggleFavorite: (file: WorkspaceFile) => void
  onMove: (file: WorkspaceFile, folderId: string) => Promise<void>
  onRename: (file: WorkspaceFile, name: string) => Promise<boolean>
  onVisibilityChange: (file: WorkspaceFile, visibility: WorkspaceFile['visibility']) => void
  onDelete: (file: WorkspaceFile) => void
  onOpen: (file: WorkspaceFile) => void
}>()

const t = useT('files')
const renameOpen = ref(false)
const deleteOpen = ref(false)
const draft = ref('')
const saving = ref(false)

const folderOptions = computed(() => flattenFolders(props.folders))
const folderLabel = computed(
  () => folderOptions.value.find((option) => option.value === props.file?.folderId)?.label,
)

// The dialog belongs to the selection, so switching files closes it instead of
// keeping a draft name that points at a different file.
watch(
  () => props.file?.id,
  () => {
    renameOpen.value = false
    deleteOpen.value = false
    draft.value = ''
  },
)

function openRename() {
  if (!props.file) return
  draft.value = props.file.name
  renameOpen.value = true
}

async function submitRename() {
  if (!props.file) return
  const name = draft.value.trim()
  if (!name || name === props.file.name) {
    renameOpen.value = false
    return
  }
  saving.value = true
  try {
    if (await props.onRename(props.file, name)) renameOpen.value = false
  } finally {
    saving.value = false
  }
}

function setVisibility(checked: boolean) {
  if (!props.file) return
  props.onVisibilityChange(props.file, checked ? 'team' : 'private')
}

function setFolder(folderId: string) {
  if (!props.file || folderId === props.file.folderId) return
  void props.onMove(props.file, folderId)
}

// Key names rather than translated labels: React shows this object through a
// JsonViewer, so `mime` and `uploadedBy` are the field names a developer reading
// the panel expects, and no locale key has to be invented for them.
const metadata = computed(() => {
  const file = props.file
  if (!file) return []
  return [
    { key: 'id', value: file.id, mono: true },
    { key: 'name', value: file.name },
    { key: 'mime', value: file.mime, mono: true },
    { key: 'size', value: formatFileSize(file.size, props.language) },
    { key: 'folder', value: folderPathLabel(props.folders, file.folderId) || '—' },
    { key: 'visibility', value: file.visibility },
    { key: 'favorite', value: String(file.favorite) },
    { key: 'uploadedBy', value: file.uploadedByName },
    { key: 'updatedAt', value: file.updatedAt },
    { key: 'preview', value: isPreviewable(file) ? 'dataUrl' : 'none' },
  ]
})

const icon = computed(() => fileIcon(props.file ?? { mime: 'application/octet-stream' }))
</script>

<template>
  <EmptyState
    v-if="!props.file"
    :icon="File"
    :title="t('preview.emptyTitle')"
    :description="t('preview.emptyDescription')"
    data-preview-empty
  />
  <div v-else class="space-y-4" data-file-preview>
    <div class="flex items-start justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
        >
          <img
            v-if="isPreviewable(props.file)"
            :src="props.file.dataUrl"
            alt=""
            class="size-full object-cover"
          />
          <component :is="icon" v-else class="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold" data-preview-name>{{ props.file.name }}</p>
          <p class="text-xs text-muted-foreground">
            {{ formatFileSize(props.file.size, props.language) }} ·
            {{ formatDate(props.file.updatedAt, props.language, { dateStyle: 'medium' }) }}
          </p>
        </div>
      </div>
      <div v-if="props.canManage" class="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :aria-pressed="props.file.favorite"
          :aria-label="
            props.file.favorite
              ? t('actions.unfavoriteNamed', { name: props.file.name })
              : t('actions.favoriteNamed', { name: props.file.name })
          "
          data-preview-favorite
          @click="props.onToggleFavorite(props.file)"
        >
          <Star
            class="size-4"
            :class="props.file.favorite && 'fill-warning text-warning'"
            aria-hidden="true"
          />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          :aria-label="t('preview.rename')"
          data-preview-rename
          @click="openRename"
        >
          <Pencil class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border">
      <img
        v-if="isPreviewable(props.file)"
        :src="props.file.dataUrl"
        :alt="props.file.name"
        class="max-h-72 w-full bg-muted/30 object-contain"
      />
      <div v-else class="flex h-44 flex-col items-center justify-center gap-2 bg-muted/30">
        <component :is="icon" class="size-10 text-muted-foreground" aria-hidden="true" />
        <p class="text-xs text-muted-foreground">{{ t('preview.noPreview') }}</p>
      </div>
    </div>

    <dl class="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2" data-preview-meta>
      <div v-for="row in metadata" :key="row.key" class="min-w-0">
        <dt class="font-mono text-muted-foreground">{{ row.key }}</dt>
        <!-- Wrapped, not truncated: an ISO timestamp and a file id are the two
             values a reader actually copies out of this panel. -->
        <dd class="break-all" :class="row.mono && 'font-mono'">{{ row.value }}</dd>
      </div>
    </dl>

    <div v-if="props.canManage" class="space-y-3 rounded-xl border p-3" data-preview-manage>
      <div class="space-y-1.5">
        <p class="text-sm font-medium">{{ t('preview.move') }}</p>
        <Select :model-value="props.file.folderId" @update:modelValue="setFolder(String($event))">
          <SelectTrigger :aria-label="t('preview.moveAria')" data-move-select>
            <SelectValue :label="folderLabel" :placeholder="t('preview.movePlaceholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in folderOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center justify-between gap-3">
        <div class="space-y-0.5">
          <p class="text-sm font-medium">{{ t('preview.visibility') }}</p>
          <p class="text-xs text-muted-foreground">{{ t('preview.visibilityHelp') }}</p>
        </div>
        <Switch
          :model-value="props.file.visibility === 'team'"
          :aria-label="t('preview.visibility')"
          data-visibility-switch
          @update:modelValue="setVisibility($event === true)"
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        class="w-full"
        data-preview-delete
        @click="deleteOpen = true"
      >
        <Trash2 class="size-4" aria-hidden="true" />
        {{ t('actions.delete') }}
      </Button>
    </div>

    <div v-if="props.images.length > 1" class="space-y-2">
      <p class="text-sm font-medium">{{ t('preview.gallery') }}</p>
      <div class="grid grid-cols-3 gap-2" data-preview-gallery>
        <button
          v-for="image in props.images"
          :key="image.id"
          type="button"
          class="overflow-hidden rounded-md border outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          :class="image.id === props.file.id && 'border-primary ring-1 ring-primary/30'"
          :aria-label="image.name"
          @click="props.onOpen(image)"
        >
          <img :src="image.dataUrl" :alt="image.name" class="aspect-square w-full object-cover" />
        </button>
      </div>
    </div>

    <Dialog :open="renameOpen" @update:open="renameOpen = $event">
      <DialogContent data-rename-dialog>
        <form class="space-y-4" @submit.prevent="submitRename">
          <DialogHeader>
            <DialogTitle>{{ t('preview.renameTitle') }}</DialogTitle>
            <DialogDescription>{{ t('preview.renameDescription') }}</DialogDescription>
          </DialogHeader>
          <div class="space-y-1.5">
            <Label for="file-rename">{{ t('preview.renameLabel') }}</Label>
            <Input
              id="file-rename"
              v-model="draft"
              :placeholder="t('preview.renamePlaceholder')"
              :maxlength="80"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" @click="renameOpen = false">
              {{ t('preview.cancel') }}
            </Button>
            <Button type="submit" :disabled="saving || !draft.trim()">
              {{ t('preview.save') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog
      v-model:open="deleteOpen"
      :title="t('preview.deleteTitle')"
      :description="t('preview.deleteDescription', { name: props.file.name })"
      :confirm-label="t('actions.delete')"
      :cancel-label="t('preview.cancel')"
      :pending="props.deleting"
      @confirm="props.onDelete(props.file)"
    />
  </div>
</template>
