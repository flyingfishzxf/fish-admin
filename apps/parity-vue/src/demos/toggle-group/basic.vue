<script lang="ts">
export default { name: 'ToggleGroupBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Toggle, ToggleGroup } from '@fish-admin/vue'
import { Columns3, Rows3 } from 'lucide-vue-next'

const RECORDS = ['Aurora', 'Borealis', 'Cascade', 'Delta']

const layout = ref('rows')
</script>

<template>
  <div class="fish-demo-stack">
    <div style="width: 320px">
      <ToggleGroup v-model="layout" type="single" aria-label="Result layout">
        <Toggle value="rows"><Rows3 /> Rows</Toggle>
        <Toggle value="columns"><Columns3 /> Columns</Toggle>
      </ToggleGroup>
    </div>
    <div
      :style="{
        width: '320px',
        display: 'grid',
        gap: '0.5rem',
        gridTemplateColumns: layout === 'columns' ? 'repeat(2, minmax(0, 1fr))' : '1fr',
      }"
    >
      <div
        v-for="record in RECORDS"
        :key="record"
        style="
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        "
      >
        {{ record }}
      </div>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      type="single" keeps one value; spacing defaults to 0, so the two items join into one
      segmented control with rounded outer corners.
    </p>
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
      Selected layout: {{ layout }}
    </p>
  </div>
</template>
