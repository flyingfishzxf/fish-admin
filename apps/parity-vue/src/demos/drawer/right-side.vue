<script lang="ts">
export default { name: 'DrawerRightSide' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Drawer, Input, Label } from '@fish-admin/vue'
import { Pencil } from 'lucide-vue-next'

const open = ref(false)
const projectName = ref('Atlas redesign')
const draft = ref('Atlas redesign')
const error = ref<string | null>(null)

function handleOpenChange(next: boolean) {
  if (next) {
    draft.value = projectName.value
    error.value = null
  }
  open.value = next
}

function handleSave() {
  const value = draft.value.trim()
  if (value.length < 3) {
    error.value = 'Use at least 3 characters.'
    return
  }
  projectName.value = value
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Drawer direction="right" :open="open" @update:open="handleOpenChange">
        <template #trigger>
          <Button @click="open = true" variant="outline">
            <Pencil :size="16" />
            Rename project
          </Button>
        </template>
        <div style="display: flex; flex-direction: column; min-height: 100%">
          <header style="padding: 1rem 1.5rem">
            <h2 style="margin: 0; font-size: 1rem; font-weight: 600">Rename project</h2>
            <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
              The new name is visible to every member.
            </p>
          </header>
          <div style="display: grid; gap: 0.375rem; padding: 0 1.5rem">
            <Label for="demo-drawer-rename">Project name</Label>
            <Input id="demo-drawer-rename" v-model="draft" />
            <p
              v-if="error"
              style="margin: 0; font-size: 0.8rem; color: var(--destructive)"
              role="alert"
            >
              {{ error }}
            </p>
          </div>
          <footer style="display: flex; gap: 0.5rem; padding: 1rem 1.5rem; margin-top: auto">
            <Button @click="handleSave">Save name</Button>
            <Button variant="outline" @click="open = false">Cancel</Button>
          </footer>
        </div>
      </Drawer>
      <p class="fish-demo-muted" aria-live="polite">
        Current name: {{ projectName }}
      </p>
    </div>
  </div>
</template>
