<script lang="ts">
export default { name: 'DropzoneBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Dropzone } from '@fish-admin/vue'

const file = ref<{ name: string; size: number } | null>(null)
const error = ref<string | undefined>(undefined)

function onFiles(files: File[]) {
  const first = files[0]
  if (!first) return
  if (!first.name.toLowerCase().endsWith('.csv')) {
    file.value = null
    error.value = 'That file is not a CSV. Export the template and try again.'
    return
  }
  error.value = undefined
  file.value = { name: first.name, size: Math.max(1, Math.round(first.size / 1024)) }
}
</script>

<template>
  <div class="fish-demo-stack">
    <Dropzone
      accept=".csv"
      label="Drop the member import here"
      hint="One CSV file, up to 5 MB. Export the template first so the headers match."
      browse-label="Choose a CSV"
      :error="error"
      @files="onFiles"
    />
    <p v-if="file" class="fish-demo-muted" aria-live="polite">
      Ready to import {{ file.name }} · {{ file.size }} KB
    </p>
    <p v-else class="fish-demo-muted">Nothing queued yet.</p>
    <p class="fish-demo-muted" style="margin: 0">
      <code>accept</code> filters the native file dialog only. Dropped files bypass it, which is
      why the demo checks the extension before accepting the drop.
    </p>
  </div>
</template>
