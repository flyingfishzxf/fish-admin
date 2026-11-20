<script lang="ts">
export default { name: 'DropzoneMultiple' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Dropzone } from '@fish-admin/vue'

type PickedFile = { id: string; name: string; size: number }

const ACCEPTED = ['.png', '.jpg', '.jpeg']

const files = ref<PickedFile[]>([])
const error = ref<string | undefined>(undefined)

function onFiles(incoming: File[]) {
  const rejected = incoming.filter(
    (f) => !ACCEPTED.some((extension) => f.name.toLowerCase().endsWith(extension)),
  )
  if (rejected.length > 0) {
    error.value = `${rejected[0]?.name} is not a PNG or JPEG.`
    return
  }
  error.value = undefined
  files.value = [
    ...files.value,
    ...incoming.map((f, index) => ({
      id: `${f.name}-${f.size}-${files.value.length + index}`,
      name: f.name,
      size: Math.max(1, Math.round(f.size / 1024)),
    })),
  ]
}
</script>

<template>
  <div class="fish-demo-stack">
    <Dropzone
      multiple
      :accept="ACCEPTED.join(',')"
      label="Drop brand assets here"
      hint="PNG or JPEG, several files at once. Each file becomes one attachment."
      browse-label="Choose files"
      :error="error"
      @files="onFiles"
    />
    <template v-if="files.length > 0">
      <ul
        aria-label="Attached brand assets"
        style="margin: 0; padding-left: 1.1rem; font-size: 0.85rem"
      >
        <li v-for="f in files" :key="f.id">{{ f.name }} · {{ f.size }} KB</li>
      </ul>
      <div class="fish-demo-row">
        <Button variant="outline" size="sm" @click="files = []">Clear all</Button>
        <span class="fish-demo-muted">
          {{ files.length }} file{{ files.length === 1 ? '' : 's' }} queued for upload
        </span>
      </div>
    </template>
    <p v-else class="fish-demo-muted">No assets queued. Uploads start when you save the draft.</p>
    <p class="fish-demo-muted" style="margin: 0">
      With <code>multiple</code>, every drop arrives through the <code>files</code> event as an
      array.
    </p>
  </div>
</template>
