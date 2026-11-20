<script lang="ts">
export default { name: 'UploadProgress' }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { Upload, type UploadItem } from '@fish-admin/vue'

const MAX_SIZE = 2_000_000

const items = ref<UploadItem[]>([
  {
    id: 'assets',
    name: 'brand-assets.zip',
    size: 8_200_000,
    status: 'error',
    error: 'Connection reset by the upload endpoint.',
  },
])
let nextId = 0
let timer: ReturnType<typeof setInterval> | undefined

const hasUploading = computed(() => items.value.some((item) => item.status === 'uploading'))

watch(hasUploading, (active) => {
  if (active) {
    timer = setInterval(() => {
      items.value = items.value.map((item) => {
        if (item.status !== 'uploading') return item
        const next = Math.min(100, (item.progress ?? 0) + 25)
        return next >= 100
          ? { ...item, progress: 100, status: 'done', error: undefined }
          : { ...item, progress: next }
      })
    }, 300)
  } else if (timer) {
    clearInterval(timer)
    timer = undefined
  }
})

onBeforeUnmount(() => timer && clearInterval(timer))

function onFiles(files: File[]) {
  items.value = [
    ...items.value,
    ...files.map(
      (f): UploadItem => ({
        id: `pick-${(nextId += 1)}`,
        name: f.name,
        size: f.size,
        status: 'uploading',
        progress: 0,
      }),
    ),
  ]
}

function onRemove(item: UploadItem) {
  items.value = items.value.filter((entry) => entry.id !== item.id)
}

function onRetry(item: UploadItem) {
  items.value = items.value.map((entry) =>
    entry.id === item.id ? { ...entry, status: 'uploading', progress: 0, error: undefined } : entry,
  )
}
</script>

<template>
  <div class="fish-demo-stack">
    <Upload
      :items="items"
      label="Drop attachments"
      hint="Anything over 2 MB is rejected before it joins the queue."
      browse-label="Choose files"
      accept=".pdf,.zip,.png"
      :max-size="MAX_SIZE"
      max-size-label="Each file must be 2 MB or smaller."
      :remove-label="(item) => `Remove ${item.name}`"
      retry-label="Retry this upload"
      @files="onFiles"
      @remove="onRemove"
      @retry="onRetry"
    />
    <p class="fish-demo-muted" style="margin: 0">
      Retrying the failed row flips it back to <code>uploading</code> and the same timer advances
      it to 100 %. An oversize pick never reaches <code>files</code>: the dropzone shows the{' '}
      <code>maxSizeLabel</code> as a <code>role="alert"</code> instead.
    </p>
  </div>
</template>
