<script lang="ts">
export default { name: 'InputNumberBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { InputNumber, Label } from '@fish-admin/vue'

const seats = ref<number | null>(12)
const count = computed(() => seats.value ?? 0)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-number-seats">Licensed seats</Label>
      <div style="width: 9rem">
        <InputNumber
          id="demo-input-number-seats"
          :model-value="seats ?? 12"
          :min="1"
          :max="50"
          ariaLabel="Licensed seats"
          @update:model-value="seats = $event"
        />
      </div>
      <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
        {{ seats === null ? 'Enter a seat count between 1 and 50.' : `${count} seats × 12 AI credits = ${count * 12} credits per month.` }}
      </p>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      Type a value, click the steppers, or press ArrowUp and ArrowDown.
    </p>
  </div>
</template>
