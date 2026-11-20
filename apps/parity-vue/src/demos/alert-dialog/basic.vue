<script lang="ts">
export default { name: 'AlertDialogBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AlertDialog, Button } from '@fish-admin/vue'
import { KeyRound } from 'lucide-vue-next'

const open = ref(false)
const revoked = ref(false)

function onConfirm() {
  revoked.value = true
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button variant="destructive" size="sm" @click="open = true">
        <KeyRound aria-hidden="true" style="width: 1rem; height: 1rem" />
        Revoke API key
      </Button>
      <p class="fish-demo-muted" role="status">
        {{ revoked ? 'CI deploy key revoked.' : 'The key is still active.' }}
      </p>
    </div>
    <AlertDialog
      v-model:open="open"
      title="Revoke the CI deploy key?"
      description="Pipelines that authenticate with this key start failing on their next run. A new key must be issued before deploys can resume."
      confirm-label="Revoke key"
      cancel-label="Keep key"
      variant="destructive"
      @confirm="onConfirm"
    />
    <p class="fish-demo-muted">
      Escape or “Keep key” closes the dialog without changing anything.
    </p>
  </div>
</template>
