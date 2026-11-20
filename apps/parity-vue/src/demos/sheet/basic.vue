<script lang="ts">
export default { name: 'SheetBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Input, Label, Sheet } from '@fish-admin/vue'

const INITIAL_PROFILE = { name: 'Katherine Johnson', email: 'katherine@example.com' }

const open = ref(false)
const name = ref(INITIAL_PROFILE.name)
const email = ref(INITIAL_PROFILE.email)
const error = ref<string | null>(null)
const saved = ref<{ name: string; email: string } | null>(null)

function handleOpenChange(next: boolean) {
  if (next) {
    name.value = saved.value?.name ?? INITIAL_PROFILE.name
    email.value = saved.value?.email ?? INITIAL_PROFILE.email
    error.value = null
  }
  open.value = next
}

function handleSave() {
  if (!name.value.trim()) {
    error.value = 'Enter a display name.'
    return
  }
  if (!email.value.includes('@')) {
    error.value = 'Enter a valid email address.'
    return
  }
  error.value = null
  saved.value = { name: name.value.trim(), email: email.value.trim() }
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Sheet side="right" :open="open" @update:open="handleOpenChange">
        <template #trigger>
          <Button variant="outline">Edit profile</Button>
        </template>
        <div style="display: flex; flex-direction: column; height: 100%">
          <header style="padding: 1rem">
            <h2 style="margin: 0; font-size: 1rem; font-weight: 600">Edit profile</h2>
            <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
              Update the member name and contact email.
            </p>
          </header>
          <div style="display: grid; gap: 0.75rem; padding: 0 1rem">
            <div style="display: grid; gap: 0.375rem">
              <Label for="demo-sheet-name">Display name</Label>
              <Input
                id="demo-sheet-name"
                v-model="name"
                :aria-invalid="error ? true : undefined"
                aria-describedby="demo-sheet-error"
                @update:model-value="error = null"
              />
            </div>
            <div style="display: grid; gap: 0.375rem">
              <Label for="demo-sheet-email">Email</Label>
              <Input
                id="demo-sheet-email"
                v-model="email"
                type="email"
                :aria-invalid="error ? true : undefined"
                aria-describedby="demo-sheet-error"
                @update:model-value="error = null"
              />
            </div>
            <p
              v-if="error"
              id="demo-sheet-error"
              role="alert"
              style="margin: 0; font-size: 0.85rem; color: var(--destructive)"
            >
              {{ error }}
            </p>
          </div>
          <footer style="display: flex; gap: 0.5rem; padding: 1rem; margin-top: auto">
            <Button @click="handleSave">Save profile</Button>
            <Button variant="outline" @click="open = false">Cancel</Button>
          </footer>
        </div>
      </Sheet>
      <p class="fish-demo-muted" aria-live="polite">
        {{
          saved
            ? `Saved ${saved.name} (${saved.email}).`
            : 'The sheet slides in from the right edge.'
        }}
      </p>
    </div>
  </div>
</template>
