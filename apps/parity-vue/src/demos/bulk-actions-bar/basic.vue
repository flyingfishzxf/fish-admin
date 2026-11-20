<script lang="ts">
export default { name: 'BulkActionsBarBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { BulkActionsBar, Button } from '@fish-admin/vue'

const selected = ref(3)
const lastAction = ref('No action yet')

function clearSelection() {
  selected.value = 0
  lastAction.value = 'Selection cleared.'
}
</script>

<template>
  <div class="fish-demo-stack" style="position: relative; min-height: 10rem; overflow: hidden">
    <p class="fish-demo-muted" style="margin: 0">
      3 rows selected in the members table — the bar floats above the page content.
    </p>
    <BulkActionsBar
      :label="`${selected} members selected`"
      clear-label="Clear selection"
      @clear="clearSelection"
    >
      <Button size="sm" variant="outline" @click="lastAction = 'Email drafted.'">
        Email
      </Button>
      <Button size="sm" variant="outline" @click="lastAction = 'Export queued.'">
        Export
      </Button>
      <Button size="sm" variant="destructive" @click="lastAction = 'Deletion scheduled.'">
        Remove
      </Button>
    </BulkActionsBar>
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">Last action: {{ lastAction }}</p>
  </div>
</template>
