<script lang="ts">
export default { name: 'ErrorStateCustom' }
</script>

<script setup lang="ts">
import { ErrorState } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div
      style="
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 1.5rem;
        background: var(--card);
      "
    >
      <ErrorState
        title="Nothing to moderate"
        description="The review queue is empty. New reports will appear here the moment members flag content."
      />
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      Without a retry handler the state is a calm read-only panel — useful for genuinely empty
      surfaces that should not offer a broken "try again".
    </p>
  </div>
</template>
