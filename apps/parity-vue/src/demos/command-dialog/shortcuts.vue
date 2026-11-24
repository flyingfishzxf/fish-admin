<script lang="ts">
export default { name: 'CommandDialogShortcuts' }
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { CommandDialog, type CommandGroupDef } from '@fish-admin/vue'

const GROUPS: CommandGroupDef[] = [
  {
    heading: 'Projects',
    entries: [
      { value: 'apollo', label: 'Apollo migration', shortcut: '↵' },
      { value: 'atlas', label: 'Atlas design system', shortcut: '↵' },
    ],
  },
]

const open = ref(false)
const lastRun = ref('Nothing run yet')

function toggle(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = !open.value
  }
}

function run(label: string) {
  lastRun.value = label
  open.value = false
}

onMounted(() => window.addEventListener('keydown', toggle))
onBeforeUnmount(() => window.removeEventListener('keydown', toggle))
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-muted" style="margin: 0">
      Press <code>⌘K</code> (or <code>Ctrl+K</code>) anywhere in this preview to toggle the palette
      — the shortcut belongs to the page, not the component.
    </p>
    <p class="fish-demo-muted">Last command: {{ lastRun }}</p>
    <CommandDialog
      :open="open"
      :groups="GROUPS"
      title="Project palette"
      description="Jump straight to a project."
      placeholder="Jump to…"
      @update:open="open = $event"
      @select="run($event.label)"
    />
  </div>
</template>
