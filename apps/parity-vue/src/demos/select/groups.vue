<script lang="ts">
export default { name: 'SelectGroups' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'

const PERMISSION_LABELS: Record<string, string> = {
  none: 'No access',
  read: 'Can view',
  write: 'Can edit',
  manage: 'Can manage',
}

const permission = ref('write')
const permissionLabel = computed(() => PERMISSION_LABELS[permission.value] ?? permission.value)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-groups-permission">Default permission</Label>
      <Select v-model="permission">
        <SelectTrigger id="demo-select-groups-permission" class="fish-demo-w-72">
          <SelectValue :label="permissionLabel" placeholder="Choose a permission" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Inherited from the folder</SelectLabel>
            <SelectItem value="none">No access</SelectItem>
            <SelectItem value="read">Can view</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Set explicitly</SelectLabel>
            <SelectItem value="write">Can edit</SelectItem>
            <SelectItem value="manage">Can manage</SelectItem>
            <SelectItem value="audit" disabled>Audit export — Enterprise only</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      New members get “{{ permissionLabel }}” unless a folder overrides it.
    </p>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-select-groups-locked" style="opacity: 0.5">Team default</Label>
      <Select model-value="team-default" disabled>
        <SelectTrigger id="demo-select-groups-locked" class="fish-demo-w-72">
          <SelectValue label="Team default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="team-default">Team default</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <p class="fish-demo-muted">
      The disabled select mirrors a value set by the team owner; there is nothing to change here.
    </p>
  </div>
</template>
