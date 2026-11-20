<script lang="ts">
export default { name: 'CommandDialogBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, CommandDialog, type CommandGroupDef } from '@fish-admin/vue'
import { Search } from 'lucide-vue-next'

const GROUPS: CommandGroupDef[] = [
  {
    heading: 'Navigation',
    entries: [
      { value: 'members', label: 'Go to members' },
      { value: 'reports', label: 'Go to reports' },
    ],
  },
  {
    heading: 'Actions',
    entries: [{ value: 'invite', label: 'Invite teammate' }],
  },
]

const open = ref(false)
const lastRun = ref('Nothing run yet')

function run(label: string) {
  lastRun.value = label
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button variant="outline" size="sm" @click="open = true">
        <Search />
        Open the dialog
      </Button>
      <span class="fish-demo-muted">Last command: {{ lastRun }}</span>
    </div>
    <CommandDialog
      :open="open"
      :groups="GROUPS"
      title="Quick navigation"
      description="Search pages and actions."
      placeholder="Search pages and actions…"
      @update:open="open = $event"
      @select="run($event.label)"
    />
    <p class="fish-demo-muted">
      The palette renders in a dialog with its own screen-reader title and description; Escape
      closes it.
    </p>
  </div>
</template>
