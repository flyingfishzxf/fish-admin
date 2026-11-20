<script lang="ts">
export default { name: 'TextareaBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Label, Textarea } from '@fish-admin/vue'

const LIMIT = 280
const SEED = 'Duplicate charge confirmed with finance; refund approved on 2 Oct 2026.'

const note = ref(SEED)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-textarea-note">Review notes</Label>
      <Textarea
        id="demo-textarea-note"
        v-model="note"
        :rows="4"
        :maxlength="LIMIT"
        placeholder="Summarize why this request should be approved…"
        described-by="demo-textarea-note-count"
      />
      <p id="demo-textarea-note-count" class="fish-demo-muted">
        {{ note.length }} / {{ LIMIT }} characters · notes are attached to the audit event.
      </p>
    </div>
  </div>
</template>
