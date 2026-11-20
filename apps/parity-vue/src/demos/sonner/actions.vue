<script lang="ts">
export default { name: 'SonnerActions' }
</script>

<script setup lang="ts">
import { Button, Toaster, toast } from '@fish-admin/vue'

const TOASTER_ID = 'parity-sonner-actions'

function archiveProject() {
  toast('Archived “Q3 launch plan”', {
    toasterId: TOASTER_ID,
    description: 'The board is hidden from members.',
    duration: 8000,
    action: {
      label: 'Undo',
      onClick: () => toast.success('Project restored', { toasterId: TOASTER_ID }),
    },
  })
}

function deploy() {
  toast.error('Deploy failed', {
    toasterId: TOASTER_ID,
    description: 'Build 1284 exited with code 1.',
    duration: 8000,
    action: {
      label: 'Retry',
      onClick: () => toast.success('Build 1284 queued again', { toasterId: TOASTER_ID }),
    },
  })
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button variant="outline" size="sm" @click="archiveProject">Archive project</Button>
      <Button variant="outline" size="sm" @click="deploy">Deploy</Button>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      Both toasts pass <code>duration: 8000</code> so the action stays reachable twice as long as
      the 4 s default. Clicking the action dismisses the toast and fires a second one.
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      An action is a plain label plus a handler; the toaster renders it as a button inside the
      toast, which is portaled to the bottom right of the viewport.
    </p>
  </div>
  <Toaster :toaster-id="TOASTER_ID" aria-label="Actionable notifications" />
</template>
