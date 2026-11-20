<script lang="ts">
export default { name: 'ErrorStateBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { ErrorState } from '@fish-admin/vue'

const retryCount = ref(0)

function onRetry() {
  retryCount.value += 1
}
</script>

<template>
  <div class="fish-demo-stack">
    <ErrorState
      title="Couldn't load the report"
      description="The reporting service timed out after 30 seconds. Retry, or check the status page."
      :on-retry="onRetry"
    />
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
      {{ retryCount === 0 ? 'No retry attempted yet.' : `Retry requested ${retryCount} time(s).` }}
    </p>
    <p class="fish-demo-muted">
      The retry button is optional; without <code>onRetry</code> the state renders as read-only.
    </p>
  </div>
</template>
