<script lang="ts">
export default { name: 'LoadingOverlayBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, LoadingOverlay } from '@fish-admin/vue'

const loading = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <LoadingOverlay :loading="loading" label="Loading audit entries">
      <div style="border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem">
        <p style="margin: 0; font-weight: 500">Audit entries</p>
        <p class="fish-demo-muted" style="margin: 0.25rem 0 0">142 events · last 30 days</p>
      </div>
    </LoadingOverlay>
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="loading = !loading">
        {{ loading ? 'Stop loading' : 'Load entries' }}
      </Button>
      <span class="fish-demo-muted"
        >The overlay fades in after 150 ms, so fast loads never flash.</span
      >
    </div>
  </div>
</template>
