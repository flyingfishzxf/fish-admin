<script lang="ts">
export default { name: 'SonnerBasic' }
</script>

<script setup lang="ts">
import { Button, Toaster, toast } from '@fish-admin/vue'

const TOASTER_ID = 'parity-sonner-basic'

function handleCopy() {
  void navigator.clipboard?.writeText('https://acme.dev/invite/8f2c')
  toast('Invite link copied', { toasterId: TOASTER_ID, description: 'It expires in 7 days.' })
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button
        size="sm"
        @click="
          toast.success('Changes saved', {
            toasterId: TOASTER_ID,
            description: 'Draft v4 is now the published version.',
          })
        "
      >
        Save changes
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="
          toast.error('Could not publish', {
            toasterId: TOASTER_ID,
            description: 'The build step failed. Nothing was released.',
          })
        "
      >
        Publish release
      </Button>
      <Button variant="outline" size="sm" @click="handleCopy">Copy invite link</Button>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      Success, error and a neutral message. Each toast keeps the 4 s default and stacks at the
      bottom right of the viewport, outside the preview panel.
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      <code>Toaster</code> is mounted once at the end of this demo with an id; every toast passes
      the same <code>toasterId</code> so two demos on one page do not repeat each other.
    </p>
  </div>
  <Toaster :toaster-id="TOASTER_ID" aria-label="Saved and publish notifications" />
</template>
