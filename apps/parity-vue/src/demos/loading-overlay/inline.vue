<script lang="ts">
export default { name: 'LoadingOverlayInline' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, LoadingOverlay } from '@fish-admin/vue'

const saving = ref(false)

function saveDraft() {
  saving.value = true
  window.setTimeout(() => (saving.value = false), 1200)
}
</script>

<template>
  <div class="fish-demo-stack">
    <LoadingOverlay :loading="saving" label="Saving draft" class="rounded-xl">
      <div
        style="
          display: grid;
          gap: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
        "
      >
        <span class="fish-demo-label">Draft title</span>
        <p style="margin: 0">Release checklist — week 44</p>
        <p class="fish-demo-muted" style="margin: 0">9 items · 3 done · autosave on</p>
      </div>
    </LoadingOverlay>
    <div class="fish-demo-row">
      <Button size="sm" :disabled="saving" @click="saveDraft">
        Save draft
      </Button>
      <span class="fish-demo-muted" aria-live="polite">
        {{ saving ? 'Saving…' : 'Idle — press save to cover the panel briefly.' }}
      </span>
    </div>
  </div>
</template>
