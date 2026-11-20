<script lang="ts">
export default { name: 'TooltipSides' }
</script>

<script setup lang="ts">
import { Button, Tooltip } from '@fish-admin/vue'

const sides = [
  { side: 'top', label: 'Top', hint: 'Opens above the trigger' },
  { side: 'right', label: 'Right', hint: 'Opens to the right of the trigger' },
  { side: 'bottom', label: 'Bottom', hint: 'Opens below the trigger' },
  { side: 'left', label: 'Left', hint: 'Opens to the left of the trigger' },
] as const
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Tooltip v-for="entry in sides" :key="entry.side" :side="entry.side">
        <template #trigger>
          <Button variant="outline" size="sm">{{ entry.label }}</Button>
        </template>
        {{ entry.hint }}
      </Tooltip>
    </div>
    <p class="fish-demo-muted">
      Each trigger sets its own <code>side</code>; the arrow follows automatically.
    </p>
  </div>
</template>
