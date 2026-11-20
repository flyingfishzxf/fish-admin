<script lang="ts">
export default { name: 'CommandBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Command, type CommandGroupDef } from '@fish-admin/vue'
import { Download, KeyRound, Settings2, UserPlus } from 'lucide-vue-next'

const GROUPS: CommandGroupDef[] = [
  {
    heading: 'Workspace',
    entries: [
      {
        value: 'invite',
        label: 'Invite teammate',
        icon: UserPlus,
        shortcut: '⌘I',
      },
      {
        value: 'export',
        label: 'Export members to CSV',
        icon: Download,
      },
    ],
  },
  {
    heading: 'Account',
    entries: [
      {
        value: 'keys',
        label: 'Manage API keys',
        icon: KeyRound,
      },
      {
        value: 'settings',
        label: 'Workspace settings',
        icon: Settings2,
      },
    ],
  },
]

const lastRun = ref('Nothing run yet')
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 420px">
    <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden">
      <Command
        :groups="GROUPS"
        placeholder="Type a command or search…"
        empty-label="No commands match that search."
        aria-label="Workspace commands"
        @select="lastRun = $event.label"
      />
    </div>
    <p class="fish-demo-muted">
      Type to filter, use ↑ ↓ to move and Enter to run. Last command: {{ lastRun }}.
    </p>
  </div>
</template>
