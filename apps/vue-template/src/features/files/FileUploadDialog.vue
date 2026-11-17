<script setup lang="ts">
import type { WorkspaceFile } from '@fish-admin/contracts'
import {
  Button,
  Dropzone,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import { useT } from '../../lib/i18n'
import { uploadFile, type FileFolderSummary } from './api'
import { flattenFolders } from './folder-utils'

const props = defineProps<{
  open: boolean
  folders: FileFolderSummary[]
  defaultFolderId?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  uploaded: [file: WorkspaceFile]
}>()

const t = useT('files')
const queryClient = useQueryClient()

const MAX_DATA_URL = 256_000
const MAX_FILE_SIZE = 25 * 1024 * 1024

interface UploadRow {
  id: string
  name: string
  size: number
  status: 'queued' | 'uploading' | 'done' | 'error'
  progress: number
  error?: string
}

const folderOptions = computed(() => flattenFolders(props.folders))
// `SelectValue` prints the label it is given; without it a value set in code
// shows the placeholder until the menu has been opened once.
const folderLabel = computed(
  () => folderOptions.value.find((option) => option.value === folderId.value)?.label,
)
const folderId = ref('')
const rows = ref<UploadRow[]>([])
const previews = ref<{ src: string; name: string }[]>([])
// The File object only lives for this session; a failed row keeps it so retry
// does not ask the user to pick the file again.
const picked = new Map<string, File>()
// One upload at a time: the mock persists with a read-modify-write, so parallel
// POSTs overwrite each other and files silently disappear from the list.
let chain: Promise<void> = Promise.resolve()

// Both the open flag and the folder list matter: the drawer often opens while
// the folders query is still in flight, and an empty destination would silently
// refuse every queued file.
watch(
  [() => props.open, folderOptions],
  ([open]) => {
    if (!open) return
    const valid = props.folders.some((folder) => folder.id === folderId.value)
    if (!valid) folderId.value = props.defaultFolderId ?? folderOptions.value[0]?.value ?? ''
  },
  { immediate: true },
)

function patch(id: string, next: Partial<UploadRow>) {
  rows.value = rows.value.map((row) => (row.id === id ? { ...row, ...next } : row))
}

function readPreview(file: File): Promise<string | undefined> {
  if (file.size > MAX_DATA_URL || !file.type.startsWith('image/')) {
    return Promise.resolve(undefined)
  }
  return new Promise<string | undefined>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined)
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(file)
  })
}

async function startUpload(id: string, file: File) {
  patch(id, { status: 'uploading', progress: 20, error: undefined })
  try {
    const dataUrl = await readPreview(file)
    patch(id, { progress: 65 })
    const uploaded = await uploadFile({
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      folderId: folderId.value,
      dataUrl,
    })
    patch(id, { status: 'done', progress: 100 })
    picked.delete(id)
    if (uploaded.dataUrl) {
      previews.value = [...previews.value, { src: uploaded.dataUrl, name: uploaded.name }]
    }
    await queryClient.invalidateQueries({ queryKey: ['files'] })
    emit('uploaded', uploaded)
  } catch (error) {
    const message = error instanceof Error ? error.message : t('upload.error', { name: file.name })
    patch(id, { status: 'error', progress: 100, error: message })
  }
}

function enqueue(files: File[]) {
  if (!folderId.value) return
  for (const file of files) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    if (file.size > MAX_FILE_SIZE) {
      rows.value = [
        ...rows.value,
        {
          id,
          name: file.name,
          size: file.size,
          status: 'error',
          progress: 100,
          error: t('upload.maxSize'),
        },
      ]
      continue
    }
    picked.set(id, file)
    rows.value = [
      ...rows.value,
      { id, name: file.name, size: file.size, status: 'queued', progress: 0 },
    ]
    chain = chain.then(() => startUpload(id, file))
  }
}

function retry(row: UploadRow) {
  const file = picked.get(row.id)
  if (!file) {
    patch(row.id, { error: t('upload.retryUnavailable') })
    return
  }
  chain = chain.then(() => startUpload(row.id, file))
}

function remove(row: UploadRow) {
  picked.delete(row.id)
  rows.value = rows.value.filter((entry) => entry.id !== row.id)
}

const doneCount = computed(() => rows.value.filter((row) => row.status === 'done').length)
</script>

<template>
  <DetailDrawer
    :open="props.open"
    :title="t('upload.title')"
    :description="t('upload.description')"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4" data-upload-dialog>
      <div class="space-y-1.5">
        <p class="text-sm font-medium">{{ t('upload.destination') }}</p>
        <Select v-model="folderId">
          <SelectTrigger :aria-label="t('upload.destination')" data-upload-folder>
            <SelectValue :label="folderLabel" :placeholder="t('upload.chooseFolder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in folderOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dropzone
        multiple
        :label="t('upload.dropLabel')"
        :hint="t('upload.dropHint')"
        :browse-label="t('upload.browse')"
        accept="image/*,.pdf,.md,.csv,.json"
        :disabled="!folderId"
        @files="enqueue"
      />

      <p v-if="rows.length === 0" class="text-xs text-muted-foreground">{{ t('upload.empty') }}</p>

      <ul v-else class="space-y-2" data-upload-queue>
        <li
          v-for="row in rows"
          :key="row.id"
          class="rounded-lg border p-2 text-sm"
          :data-upload-row="row.status"
        >
          <div class="flex items-center gap-2">
            <Loader2
              v-if="row.status === 'uploading' || row.status === 'queued'"
              class="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
            <CheckCircle2
              v-else-if="row.status === 'done'"
              class="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <AlertCircle v-else class="size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate" :title="row.name">{{ row.name }}</span>
            <Button
              v-if="row.status === 'error'"
              type="button"
              variant="ghost"
              size="icon-sm"
              :aria-label="t('upload.retry')"
              @click="retry(row)"
            >
              <RotateCcw class="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              :aria-label="t('upload.remove', { name: row.name })"
              @click="remove(row)"
            >
              <X class="size-4" aria-hidden="true" />
            </Button>
          </div>
          <p v-if="row.status === 'error'" class="mt-1 text-xs text-destructive">{{ row.error }}</p>
          <div
            v-if="row.status === 'uploading' || row.status === 'queued'"
            class="mt-1.5 h-1 rounded bg-muted"
          >
            <div
              class="h-1 rounded bg-primary transition-all"
              :style="{ width: `${row.progress}%` }"
            />
          </div>
        </li>
      </ul>

      <div v-if="previews.length > 0" class="space-y-2">
        <p class="text-sm font-medium">{{ t('upload.previews') }}</p>
        <div class="grid grid-cols-3 gap-2" :aria-label="t('upload.previewsAria')">
          <img
            v-for="preview in previews.slice(-6)"
            :key="preview.src"
            :src="preview.src"
            :alt="preview.name"
            class="aspect-square w-full rounded-md border object-cover"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p class="text-xs text-muted-foreground">
          {{ t('upload.doneCount', { count: doneCount }) }}
        </p>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('upload.close') }}
        </Button>
      </div>
    </div>
  </DetailDrawer>
</template>
