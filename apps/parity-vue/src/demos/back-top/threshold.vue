<script lang="ts">
export default { name: 'BackTopThreshold' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { BackTop } from '@fish-admin/vue'

const ROWS = Array.from(
  { length: 24 },
  (_, index) => `Batch ${index + 1} · reconciled ${index * 7 + 3} invoices`,
)

const earlyRef = ref<HTMLElement | null>(null)
const lateRef = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <p class="fish-demo-label">Threshold 40 px</p>
      <div
        style="
          position: relative;
          transform: translateZ(0);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        "
      >
        <div
          ref="earlyRef"
          role="region"
          aria-label="Invoice batches, early threshold"
          tabindex="0"
          style="height: 150px; overflow-y: auto; padding: 0.6rem 0.75rem"
        >
          <ul style="margin: 0; padding-left: 1rem; font-size: 0.78rem; line-height: 1.7">
            <li v-for="row in ROWS" :key="row">{{ row }}</li>
          </ul>
        </div>
        <BackTop
          :target="earlyRef"
          :threshold="40"
          label="Back to the start of the invoice batches"
        />
      </div>
    </div>
    <div>
      <p class="fish-demo-label">Threshold 240 px</p>
      <div
        style="
          position: relative;
          transform: translateZ(0);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        "
      >
        <div
          ref="lateRef"
          role="region"
          aria-label="Invoice batches, late threshold"
          tabindex="0"
          style="height: 150px; overflow-y: auto; padding: 0.6rem 0.75rem"
        >
          <ul style="margin: 0; padding-left: 1rem; font-size: 0.78rem; line-height: 1.7">
            <li v-for="row in ROWS" :key="row">{{ row }}</li>
          </ul>
        </div>
        <BackTop
          :target="lateRef"
          :threshold="240"
          label="Back to the start of the invoice batches"
        />
      </div>
    </div>
    <p class="fish-demo-muted">
      The left panel shows its button after 40 px of scrolling; the right one waits for 240 px.
    </p>
  </div>
</template>
