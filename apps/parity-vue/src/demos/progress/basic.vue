<script lang="ts">
export default { name: 'ProgressBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, Progress } from '@fish-admin/vue'

const STEPS = ['Details', 'Team', 'Billing', 'Review']

const step = ref(2)
const value = computed(() => step.value * 25)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label" id="demo-progress-label">Onboarding progress</span>
      <span class="fish-demo-muted">{{ value }}%</span>
    </div>
    <Progress :value="value" aria-labelledby="demo-progress-label" />
    <div class="fish-demo-row">
      <Button
        v-for="(label, index) in STEPS"
        :key="label"
        type="button"
        :variant="step >= index + 1 ? 'secondary' : 'outline'"
        size="xs"
        @click="step = index + 1"
      >
        {{ label }}
      </Button>
    </div>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      Step {{ step }} of {{ STEPS.length }} — {{ STEPS[step - 1] }}.
    </p>
  </div>
</template>
