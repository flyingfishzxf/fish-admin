<script lang="ts">
export default { name: 'TooltipBasic' }
</script>

<script setup lang="ts">
import { Button, Tooltip } from '@fish-admin/vue'
import { Settings2 } from 'lucide-vue-next'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Tooltip>
        <template #trigger>
          <Button variant="outline" size="sm">Copy invite link</Button>
        </template>
        Copy the invite link to your clipboard
      </Tooltip>
      <Tooltip>
        <template #trigger>
          <Button variant="outline" size="icon-sm" aria-label="Invite settings">
            <Settings2 />
          </Button>
        </template>
        Invite settings
      </Tooltip>
    </div>
    <p class="fish-demo-muted">
      Hover a trigger, or focus it with the keyboard, to open the tooltip.
    </p>
  </div>
</template>
