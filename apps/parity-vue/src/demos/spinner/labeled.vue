<script lang="ts">
export default { name: 'SpinnerLabeled' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, LoadingOverlay, Spinner } from '@fish-admin/vue'

const loading = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Spinner label="Loading invoices" />
      <span class="fish-demo-label">
        Labeled spinner: a status region instead of aria-hidden
      </span>
    </div>
    <LoadingOverlay :loading="loading" label="Refreshing quarterly report">
      <div
        style="
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
        "
      >
        <p style="margin: 0; font-weight: 500">Quarterly report</p>
        <p class="fish-demo-muted" style="margin: 0.25rem 0 0">Updated 1 Oct 2026 · 24 pages</p>
      </div>
    </LoadingOverlay>
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="loading = !loading">
        {{ loading ? 'Stop refreshing' : 'Refresh report' }}
      </Button>
      <span class="fish-demo-muted">
        The overlay waits 150 ms before it covers the region.
      </span>
    </div>
  </div>
</template>
