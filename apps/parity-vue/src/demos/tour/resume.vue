<script lang="ts">
export default { name: 'TourResume' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Input, Tour, type TourStep } from '@fish-admin/vue'

const open = ref(false)
const completed = ref(false)

const steps: TourStep[] = [
  {
    target: '#tour-retention',
    title: 'Set the retention window',
    description: 'Days of audit logs to keep. Range is 7 to 365.',
    placement: 'bottom',
  },
  {
    target: '#tour-apply',
    title: 'Apply across workspaces',
    description: 'Pushes the setting to every workspace you own.',
    placement: 'top',
  },
]
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <p class="fish-demo-label" style="margin: 0">Audit retention</p>
      <Button
        v-if="!completed"
        type="button"
        size="sm"
        variant="outline"
        @click="open = true"
      >
        Guided setup
      </Button>
      <p v-else class="fish-demo-muted" style="margin: 0">Setup completed.</p>
    </div>
    <div class="fish-demo-row" style="align-items: flex-end">
      <div id="tour-retention" style="flex: 1; min-width: 10rem">
        <p class="fish-demo-label">Retention days</p>
        <Input type="number" aria-label="Retention days" model-value="90" min="7" max="365" />
      </div>
      <div id="tour-apply" style="align-self: flex-end">
        <Button type="button" size="sm" @click="completed = true">Apply</Button>
      </div>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        completed
          ? 'The tour is dismissed and will not offer to reopen.'
          : 'Finishing the tour calls finish and hides the launcher.'
      }}
    </p>
    <Tour
      :steps="steps"
      :open="open"
      :labels="{ next: 'Next', previous: 'Back', skip: 'Skip', finish: 'Done', step: '{{current}} / {{total}}' }"
      @update:open="open = $event"
      @finish="completed = true"
    />
  </div>
</template>
