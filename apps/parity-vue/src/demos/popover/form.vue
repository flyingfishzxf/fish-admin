<script lang="ts">
export default { name: 'PopoverForm' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Input, Label, Popover } from '@fish-admin/vue'

const open = ref(false)
const name = ref('')
const saved = ref('')

function submit() {
  const value = name.value.trim()
  if (value.length === 0) return
  saved.value = value
  name.value = ''
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Popover v-model:open="open" align="start" class="w-72 p-4">
        <template #trigger>
          <Button variant="outline" size="sm">Create label</Button>
        </template>
        <form class="fish-demo-stack" style="gap: 0.6rem" @submit.prevent="submit">
          <p id="demo-popover-form-title" style="margin: 0; font-size: 0.875rem; font-weight: 600">
            New label
          </p>
          <p
            id="demo-popover-form-description"
            class="fish-demo-muted"
            style="margin: 0; font-size: 0.8rem"
          >
            Labels group reports across the workspace.
          </p>
          <div class="fish-demo-stack" style="gap: 0.35rem">
            <Label for="demo-popover-form-name">Label name</Label>
            <Input id="demo-popover-form-name" v-model="name" placeholder="Quarterly review" />
          </div>
          <div class="fish-demo-row" style="justify-content: flex-end">
            <Button type="button" variant="ghost" size="sm" @click="open = false">Cancel</Button>
            <Button type="submit" size="sm" :disabled="name.trim().length === 0">
              Save label
            </Button>
          </div>
        </form>
      </Popover>
      <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
        {{ saved ? `Saved “${saved}”.` : 'The form opens aligned to the start of its trigger.' }}
      </p>
    </div>
  </div>
</template>
