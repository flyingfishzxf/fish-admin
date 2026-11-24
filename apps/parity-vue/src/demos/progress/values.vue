<script lang="ts">
export default { name: 'ProgressValues' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Progress } from '@fish-admin/vue'

const TASKS = [
  { label: 'Extract rows', value: 100, detail: '1,284 of 1,284 rows read' },
  { label: 'Normalise fields', value: 64, detail: '822 of 1,284 rows cleaned' },
  { label: 'Validate totals', value: 0, detail: 'Queued until normalisation ends' },
]

const processed = ref(TASKS[1].value)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 1rem">
      <div v-for="task in TASKS" :key="task.label" class="fish-demo-stack" style="gap: 0.35rem">
        <div class="fish-demo-row" style="justify-content: space-between">
          <span class="fish-demo-label">{{ task.label }}</span>
          <span class="fish-demo-muted"
            >{{ task.label === 'Normalise fields' ? processed : task.value }}%</span
          >
        </div>
        <Progress
          :value="task.label === 'Normalise fields' ? processed : task.value"
          :aria-label="task.label"
        />
        <p class="fish-demo-muted" style="margin: 0">
          {{
            task.label === 'Normalise fields'
              ? `${processed}% of rows cleaned; each click adds 12 points.`
              : task.detail
          }}
        </p>
      </div>
    </div>

    <div class="fish-demo-row">
      <Button
        type="button"
        variant="outline"
        size="sm"
        :disabled="processed === 100"
        @click="processed = Math.min(100, processed + 12)"
      >
        Advance normalisation
      </Button>
      <p class="fish-demo-muted" style="margin: 0">
        A value of 0 renders an empty track; 100 fills it completely.
      </p>
    </div>
  </div>
</template>
