<script setup lang="ts">
import { CheckCircle2, FileText, RotateCcw, TriangleAlert, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import Dropzone from './Dropzone.vue'
import { Button } from '../ui/button'

export interface UploadItem {
  id: string
  name: string
  size: number
  status?: 'uploading' | 'done' | 'error'
  progress?: number
  error?: string
}

const props = withDefaults(
  defineProps<{
    /** The file rows to render, each carrying name, size and an optional status, progress or error. */
    items: UploadItem[]
    /** Called with the accepted files that pass the size check, straight from the dropzone. */
    onFiles: (files: File[]) => void
    /** When provided, every row gets a remove button that calls this with the row. */
    onRemove?: (item: UploadItem) => void
    /** When provided, error rows get a retry button that calls this with the row. */
    onRetry?: (item: UploadItem) => void
    /** Native accept hint for the browse dialog; drag and drop is not filtered by it. */
    accept?: string
    /** Primary instruction and accessible name of the hidden file input. */
    label: string
    /** Secondary line under the label, for format and size guidance. */
    hint?: string
    /** Text of the browse button; falls back to the translated default. */
    browseLabel?: string
    /** Per-file byte ceiling; larger picks are blocked before onFiles runs. */
    maxSize?: number
    /** Message surfaced as an alert when a file exceeds maxSize. */
    maxSizeLabel?: string
    /** Builds the accessible name of each remove button from the row. */
    removeLabel?: (item: UploadItem) => string
    /** Accessible name of the retry button on an error row. */
    retryLabel?: string
    /** Blocks dragging, the file input and the browse button. */
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false },
)

const { t } = useUITranslation()
const error = ref<string | undefined>(undefined)

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${units[exponent]}`
}

function handleFiles(files: File[]) {
  if (props.maxSize) {
    const oversized = files.filter((file) => file.size > props.maxSize!)
    if (oversized.length > 0) {
      error.value = props.maxSizeLabel ?? `Files must be ${formatSize(props.maxSize)} or smaller.`
      return
    }
  }
  error.value = undefined
  props.onFiles(files)
}

const dropzoneLabel = computed(() => props.label)
</script>

<template>
  <div data-slot="upload" :class="cn('space-y-3', props.class)">
    <Dropzone
      :label="dropzoneLabel"
      :hint="props.hint"
      :browse-label="props.browseLabel"
      :accept="props.accept"
      :disabled="props.disabled"
      @files="handleFiles"
      @file="(file) => handleFiles([file])"
    >
      <template #hint-extra>
        <span v-if="props.maxSize">{{ formatSize(props.maxSize) }}</span>
      </template>
    </Dropzone>

    <p v-if="error" role="alert" class="flex items-center gap-1 text-xs text-destructive">
      <TriangleAlert aria-hidden="true" class="size-3" />
      {{ error }}
    </p>

    <ul v-if="props.items.length > 0" data-slot="upload-list" class="space-y-1">
      <li
        v-for="item in props.items"
        :key="item.id"
        data-slot="upload-item"
        class="flex items-center gap-3 rounded-lg border px-3 py-2"
      >
        <FileText aria-hidden="true" class="size-4 shrink-0 text-muted-foreground" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ item.name }}</p>
          <div v-if="item.status === 'uploading'" class="mt-1.5 flex items-center gap-2">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${item.progress ?? 0}%` }"
              ></div>
            </div>
            <span class="w-9 text-end text-[11px] text-muted-foreground tabular-nums">
              {{ item.progress ?? 0 }}%
            </span>
          </div>
          <p
            v-else-if="item.status === 'error'"
            class="mt-1 flex items-center gap-1 text-xs text-destructive"
          >
            <TriangleAlert aria-hidden="true" class="size-3" />
            {{ item.error ?? t('enterprise.noData') }}
          </p>
          <p v-else class="mt-1 flex items-center gap-1 text-xs text-success">
            <CheckCircle2 aria-hidden="true" class="size-3" />
            {{ item.progress === 100 ? '100%' : null }}
          </p>
        </div>
        <Button
          v-if="item.status === 'error' && props.onRetry"
          type="button"
          variant="ghost"
          size="icon-xs"
          :aria-label="props.retryLabel ?? t('actions.retry')"
          @click="props.onRetry?.(item)"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
        <Button
          v-if="props.onRemove"
          type="button"
          variant="ghost"
          size="icon-xs"
          :aria-label="props.removeLabel?.(item) ?? t('enterprise.removeFile', { name: item.name })"
          @click="props.onRemove?.(item)"
        >
          <X aria-hidden="true" />
        </Button>
      </li>
    </ul>
  </div>
</template>
