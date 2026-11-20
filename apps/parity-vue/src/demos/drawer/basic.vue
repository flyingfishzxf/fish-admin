<script lang="ts">
export default { name: 'DrawerBasic' }
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue'

import { Button, Checkbox, Drawer, Label } from '@fish-admin/vue'

const INITIAL_PREFERENCES = { signin: true, digest: false }

const open = ref(false)
const applied = reactive({ ...INITIAL_PREFERENCES })
const draft = reactive({ ...INITIAL_PREFERENCES })

function handleOpenChange(next: boolean) {
  if (next) Object.assign(draft, applied)
  open.value = next
}

function save() {
  Object.assign(applied, draft)
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Drawer :open="open" @update:open="handleOpenChange">
        <template #trigger>
          <Button @click="open = true" variant="outline">Notification settings</Button>
        </template>
        <div style="max-width: 32rem; margin-left: auto; margin-right: auto; width: 100%">
          <header style="padding: 1rem 1.5rem">
            <h2 style="margin: 0; font-size: 1rem; font-weight: 600">Notification settings</h2>
            <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
              Choose which emails this workspace sends you.
            </p>
          </header>
          <div style="display: grid; gap: 0.75rem; padding: 0 1.5rem">
            <div class="fish-demo-row">
              <Checkbox
                id="demo-drawer-signin"
                v-model="draft.signin"
              />
              <Label for="demo-drawer-signin">Sign-in alerts</Label>
            </div>
            <div class="fish-demo-row">
              <Checkbox
                id="demo-drawer-digest"
                v-model="draft.digest"
              />
              <Label for="demo-drawer-digest">Weekly digest</Label>
            </div>
          </div>
          <footer style="display: flex; gap: 0.5rem; padding: 1rem 1.5rem">
            <Button @click="save">Save preferences</Button>
            <Button variant="outline" @click="open = false">Not now</Button>
          </footer>
        </div>
      </Drawer>
      <p class="fish-demo-muted" aria-live="polite">
        Sign-in alerts {{ applied.signin ? 'on' : 'off' }} · Weekly digest
        {{ applied.digest ? 'on' : 'off' }}
      </p>
    </div>
  </div>
</template>
