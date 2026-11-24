<script lang="ts">
export default { name: 'BulkActionsBarRegion' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { BulkActionsBar, Button } from '@fish-admin/vue'

const rows = ref(12)
const archived = ref(false)

function archiveAll() {
  archived.value = true
  rows.value = 0
}
</script>

<template>
  <div class="fish-demo-stack" style="position: relative; min-height: 10rem; overflow: hidden">
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
      {{
        archived ? 'Every row was archived — the selection is gone.' : `${rows} invoices selected.`
      }}
    </p>
    <BulkActionsBar
      label="Bulk actions"
      region-label="Invoice bulk actions"
      clear-label="Deselect all invoices"
      @clear="rows = 0"
    >
      <Button size="sm" variant="outline" :disabled="archived" @click="archiveAll">
        Archive all
      </Button>
      <Button size="sm" variant="outline" :disabled="archived">Send reminders</Button>
    </BulkActionsBar>
    <p class="fish-demo-muted" style="margin: 0">
      <code>regionLabel</code> overrides the accessible name of the floating region, so screen
      readers can tell several bars apart on one page.
    </p>
  </div>
</template>
