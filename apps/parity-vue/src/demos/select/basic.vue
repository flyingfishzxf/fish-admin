<script lang="ts">
export default { name: 'SelectBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

const ROLES = [
  { value: 'owner', label: 'Owner', scope: 'Full access, including billing.' },
  { value: 'admin', label: 'Admin', scope: 'Manage members, projects and integrations.' },
  { value: 'member', label: 'Member', scope: 'Work on projects, no workspace settings.' },
  { value: 'viewer', label: 'Viewer', scope: 'Read-only access to shared projects.' },
]

const role = ref('admin')
const current = computed(() => ROLES.find((option) => option.value === role.value))
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-role">Assign role</Label>
      <Select v-model="role">
        <SelectTrigger id="demo-select-role" class="fish-demo-w-72">
          <SelectValue :label="current?.label" placeholder="Choose a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in ROLES" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{ current ? `${current.label}: ${current.scope}` : 'No role selected.' }}
    </p>
  </div>
</template>
