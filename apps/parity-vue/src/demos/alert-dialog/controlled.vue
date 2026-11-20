<script lang="ts">
export default { name: 'AlertDialogControlled' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AlertDialog, Button } from '@fish-admin/vue'

const open = ref(false)
const result = ref('No decision yet.')

function onOpenChange(next: boolean) {
  open.value = next
  if (!next) result.value = 'Transfer cancelled. Ownership stays.'
}

function onConfirm() {
  result.value = 'Ownership transferred to Ada Lovelace.'
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button variant="outline" size="sm" @click="open = true">Transfer ownership</Button>
      <p class="fish-demo-muted" role="status">{{ result }}</p>
    </div>
    <AlertDialog
      :open="open"
      title="Transfer to Ada?"
      description="Ada becomes the workspace owner. You keep admin access but lose control of billing and member management."
      confirm-label="Transfer"
      cancel-label="Cancel"
      variant="default"
      @update:open="onOpenChange"
      @confirm="onConfirm"
    />
    <p class="fish-demo-muted">
      The page owns the open state, so the result line updates from the same handlers that close
      the dialog.
    </p>
  </div>
</template>
