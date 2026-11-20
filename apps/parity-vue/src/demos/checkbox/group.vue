<script lang="ts">
export default { name: 'CheckboxGroup' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Checkbox, Label } from '@fish-admin/vue'

const OPTIONS = [
  { id: 'weekly', label: 'Weekly digest', hint: 'Every Monday at 09:00, workspace time.' },
  { id: 'security', label: 'Security alerts', hint: 'New device sign-ins and revoked keys.' },
  { id: 'billing', label: 'Billing receipts', hint: 'Invoices, refunds and failed payments.' },
]

const selected = ref<string[]>(['security'])

function toggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((item) => item !== id)
}

const selectedLabels = computed(() =>
  OPTIONS.filter((option) => selected.value.includes(option.id)).map((option) => option.label),
)
</script>

<template>
  <div class="fish-demo-stack">
    <div role="group" aria-labelledby="demo-checkbox-group-label" class="fish-demo-stack">
      <span id="demo-checkbox-group-label" class="fish-demo-label">Email notifications</span>
      <div v-for="option in OPTIONS" :key="option.id" class="fish-demo-row" style="align-items: flex-start">
        <Checkbox
          :id="`demo-checkbox-group-${option.id}`"
          :model-value="selected.includes(option.id)"
          :aria-describedby="`demo-checkbox-group-${option.id}-hint`"
          @update:model-value="(checked) => toggle(option.id, checked === true)"
        />
        <div>
          <Label :for="`demo-checkbox-group-${option.id}`">{{ option.label }}</Label>
          <p
            :id="`demo-checkbox-group-${option.id}-hint`"
            class="fish-demo-muted"
            style="margin: 0.35rem 0 0"
          >
            {{ option.hint }}
          </p>
        </div>
      </div>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{ selectedLabels.length > 0 ? `Sending: ${selectedLabels.join(', ')}.` : 'All notifications are muted.' }}
    </p>
  </div>
</template>
