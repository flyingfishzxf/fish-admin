<script lang="ts">
export default { name: 'InputNumberBounded' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { InputNumber, Label } from '@fish-admin/vue'

const seats = ref<number | null>(4)
const storage = ref<number | null>(1.5)
const seatCount = computed(() => seats.value ?? 0)
const storageCount = computed(() => storage.value ?? 0)
const total = computed(() => seatCount.value * 12 + storageCount.value * 4)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-number-bounded-seats">Seats (1–10, step 1)</Label>
      <div style="width: 9rem">
        <InputNumber
          id="demo-input-number-bounded-seats"
          :model-value="seats ?? 4"
          :min="1"
          :max="10"
          ariaLabel="Seats"
          @update:model-value="seats = $event"
        />
      </div>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-number-bounded-storage">Extra storage (0–5 GB, step 0.5)</Label>
      <div style="width: 9rem">
        <InputNumber
          id="demo-input-number-bounded-storage"
          :model-value="storage ?? 0"
          :min="0"
          :max="5"
          :step="0.5"
          :precision="1"
          ariaLabel="Extra storage in gigabytes"
          @update:model-value="storage = $event"
        />
      </div>
    </div>

    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{ `$${total.toFixed(2)} per month: ${seatCount} × $12 plus ${storageCount.toFixed(1)} GB × $4.` }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      Both steppers disable at their bounds; typed values clamp and reformat on commit.
    </p>
  </div>
</template>
