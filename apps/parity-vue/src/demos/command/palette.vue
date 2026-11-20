<script lang="ts">
export default { name: 'CommandPalette' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, CommandDialog, type CommandGroupDef } from '@fish-admin/vue'
import { FolderKanban, Plus, Search, UserPlus } from 'lucide-vue-next'

const GROUPS: CommandGroupDef[] = [
  {
    heading: 'Projects',
    entries: [
      { value: 'apollo', label: 'Apollo migration', icon: FolderKanban, shortcut: '↵' },
      { value: 'atlas', label: 'Atlas design system', icon: FolderKanban, shortcut: '↵' },
      { value: 'zephyr', label: 'Zephyr release', icon: FolderKanban, shortcut: '↵' },
    ],
  },
  {
    heading: 'Actions',
    entries: [
      { value: 'create', label: 'Create project', icon: Plus, shortcut: 'C' },
      { value: 'invite', label: 'Invite teammate', icon: UserPlus, shortcut: 'I' },
    ],
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
  <div class="fish-demo-stack" style="max-width: 420px">
    <div class="fish-demo-row">
      <Button variant="outline" size="sm" @click="open = true">
        <Search />
        Open command palette
      </Button>
      <span class="fish-demo-muted">⌘K is bound in the template, not by the component</span>
    </div>
    <p class="fish-demo-muted">Last command: {{ lastRun }}</p>
    <CommandDialog
      :open="open"
      :groups="GROUPS"
      title="Command palette"
      description="Search projects and workspace actions."
      placeholder="Search projects and actions…"
      empty-label="Nothing matches that search."
      @update:open="open = $event"
      @select="run($event.label)"
    />
  </div>
</template>
