<script lang="ts">
export default { name: 'UploadBasic' }
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { Upload, type UploadItem } from '@fish-admin/vue'

const items = ref<UploadItem[]>([
  { id: 'report', name: 'quarterly-report.pdf', size: 1_480_000, status: 'done', progress: 100 },
])
let nextId = 0
let timer: ReturnType<typeof setInterval> | undefined

const hasUploading = computed(() => items.value.some((item) => item.status === 'uploading'))

watch(hasUploading, (active) => {
  if (active) {
    timer = setInterval(() => {
      items.value = items.value.map((item) => {
        if (item.status !== 'uploading') return item
        const next = Math.min(100, (item.progress ?? 0) + 20)
        return next >= 100 ? { ...item, progress: 100, status: 'done' } : { ...item, progress: next }
      })
    }, 350)
  } else if (timer) {
    clearInterval(timer)
    timer = undefined
  }
})

onBeforeUnmount(() => timer && clearInterval(timer))

const uploadingCount = computed(() =>
  items.value.filter((item) => item.status === 'uploading').length,
)

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
</script>

<template>
  <div class="fish-demo-stack">
    <Upload
      :items="items"
      label="Drop the export or browse"
      hint="Attach the report files. This demo simulates the transfer; nothing is uploaded."
      browse-label="Choose files"
      :remove-label="(item) => `Remove ${item.name}`"
      @files="onFiles"
      @remove="onRemove"
    />
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{
        uploadingCount > 0
          ? `${uploadingCount} file${uploadingCount === 1 ? '' : 's'} transferring…`
          : `${items.length} file${items.length === 1 ? '' : 's'} ready in the queue.`
      }}
    </p>
  </div>
</template>
