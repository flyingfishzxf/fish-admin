<script lang="ts">
export default { name: 'StepperBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Stepper, type StepperStep } from '@fish-admin/vue'

const STEPS: StepperStep[] = [
  { id: 'workspace', title: 'Workspace', description: 'Name the workspace and pick a region.' },
  { id: 'billing', title: 'Billing', description: 'Choose a plan and add a payment method.' },
  { id: 'members', title: 'Members', description: 'Invite the first teammates.' },
  { id: 'review', title: 'Review', description: 'Confirm the details and finish.' },
]

const current = ref(1)
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
    <Stepper
      :steps="STEPS"
      :current="current"
      ariaLabel="Workspace setup steps"
      @step-click="current = $event"
    />
    <div class="fish-demo-row">
      <Button
        variant="outline"
        size="sm"
        :disabled="current === 0"
        @click="current = Math.max(0, current - 1)"
      >
        Back
      </Button>
      <Button
        size="sm"
        :disabled="current === STEPS.length - 1"
        @click="current = Math.min(STEPS.length - 1, current + 1)"
      >
        Next
      </Button>
      <span class="fish-demo-muted" aria-live="polite">
        Step {{ current + 1 }} of {{ STEPS.length }}
      </span>
    </div>
    <p class="fish-demo-muted">
      Completed steps are buttons as well; steps after the current one stay inert.
    </p>
  </div>
</template>
