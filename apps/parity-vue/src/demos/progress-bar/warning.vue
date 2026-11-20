<script lang="ts">
export default { name: 'ProgressBarWarning' }
</script>

<script setup lang="ts">
import { ProgressBar } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.35rem">
      <div class="fish-demo-row" style="justify-content: space-between">
        <span class="fish-demo-label">Seat usage</span>
        <span class="fish-demo-muted">48 of 50</span>
      </div>
      <ProgressBar :value="96" ariaLabel="Seat usage" tone="warning" />
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      The warning tone turns the fill amber once a quota is nearly exhausted; the value still
      clamps to 0–100.
    </p>
  </div>
</template>
