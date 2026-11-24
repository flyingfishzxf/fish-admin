<script lang="ts">
export default { name: 'RadioGroupBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { RadioGroup } from '@fish-admin/vue'

const PLANS = [
  { value: 'starter', label: 'Starter', hint: 'Up to 3 members, community support.' },
  { value: 'team', label: 'Team', hint: '$12 per seat, audit log export.' },
  { value: 'enterprise', label: 'Enterprise', hint: 'SSO, scoped roles, priority SLA.' },
]

const plan = ref('team')
const current = computed(() => PLANS.find((option) => option.value === plan.value))
</script>

<template>
  <div class="fish-demo-stack">
    <span id="demo-radio-plan-label" class="fish-demo-label">Billing plan</span>
    <RadioGroup v-model="plan" :options="PLANS" aria-label="Billing plan" />
    <div class="fish-demo-stack" style="gap: 0.35rem">
      <p v-for="option in PLANS" :key="option.value" class="fish-demo-muted" style="margin: 0">
        <strong>{{ option.label }}</strong> — {{ option.hint }}
      </p>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{ current ? `${current.label} selected — ${current.hint}` : 'No plan selected.' }}
    </p>
  </div>
</template>
