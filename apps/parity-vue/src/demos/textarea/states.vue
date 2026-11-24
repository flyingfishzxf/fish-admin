<script lang="ts">
export default { name: 'TextareaStates' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Label, Textarea } from '@fish-admin/vue'

const MIN_REASON = 12

const reason = ref('')
const tooShort = computed(() => reason.value.trim().length < MIN_REASON)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-textarea-states-disabled" style="opacity: 0.5"> Resolution summary </Label>
      <Textarea
        id="demo-textarea-states-disabled"
        :rows="3"
        disabled
        model-value="Refund approved by finance; the duplicate charge is reversed."
        described-by="demo-textarea-states-disabled-hint"
      />
      <p id="demo-textarea-states-disabled-hint" class="fish-demo-muted">
        Read-only once the request is resolved; the reviewer writes it while closing.
      </p>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-textarea-states-invalid">Rejection reason</Label>
      <Textarea
        id="demo-textarea-states-invalid"
        v-model="reason"
        :rows="3"
        :invalid="tooShort"
        described-by="demo-textarea-states-invalid-hint"
        placeholder="Explain what the requester should change…"
      />
      <p id="demo-textarea-states-invalid-hint" class="fish-demo-muted">
        {{
          tooShort
            ? `A rejection needs at least ${MIN_REASON} characters so the requester knows what to fix.`
            : 'The requester receives this text in the notification email.'
        }}
      </p>
    </div>
  </div>
</template>
