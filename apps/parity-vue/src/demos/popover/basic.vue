<script lang="ts">
export default { name: 'PopoverBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Badge, Button, Checkbox, Label, Popover } from '@fish-admin/vue'

const CHANNELS = [
  { id: 'digest', label: 'Weekly digest' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'approvals', label: 'Approvals' },
]

const selected = ref<string[]>(['mentions', 'approvals'])

function toggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((item) => item !== id)
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Popover align="start" class="w-72 p-4">
        <template #trigger>
          <Button variant="outline" size="sm">
            Filter notifications
            <Badge variant="secondary">{{ selected.length }}</Badge>
          </Button>
        </template>
        <p style="margin: 0; font-size: 0.875rem; font-weight: 600">Notification filters</p>
        <p class="fish-demo-muted" style="margin: 0.15rem 0 0; font-size: 0.8rem">
          Choose which alerts reach your inbox.
        </p>
        <div class="fish-demo-stack" style="gap: 0.5rem; margin-top: 0.75rem">
          <div v-for="channel in CHANNELS" :key="channel.id" class="fish-demo-row" style="gap: 0.5rem">
            <Checkbox
              :id="`demo-popover-channel-${channel.id}`"
              :model-value="selected.includes(channel.id)"
              @update:model-value="(checked) => toggle(channel.id, checked === true)"
            />
            <Label :for="`demo-popover-channel-${channel.id}`">{{ channel.label }}</Label>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          style="margin-top: 0.5rem; padding-left: 0"
          @click="selected = []"
        >
          Clear all
        </Button>
      </Popover>
      <p class="fish-demo-muted" style="margin: 0">
        {{
          selected.length === 0
            ? 'All notification emails are muted.'
            : `Receiving ${selected.length} of ${CHANNELS.length} notification types.`
        }}
      </p>
    </div>
  </div>
</template>
