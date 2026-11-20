<script lang="ts">
export default { name: 'StepperProgress' }
</script>

<script setup lang="ts">
import { Stepper, type StepperStep } from '@fish-admin/vue'

const STEPS: StepperStep[] = [
  { id: 'draft', title: 'Draft' },
  { id: 'review', title: 'Review' },
  { id: 'approved', title: 'Approved' },
  { id: 'published', title: 'Published' },
]
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
    <Stepper :steps="STEPS" :current="1" ariaLabel="Release approval progress" />
    <p class="fish-demo-muted">
      Without a step-click handler every step is inert: Draft is complete and Review is current,
      but neither is a button. Use this form for a status readout rather than a wizard.
    </p>
  </div>
</template>
