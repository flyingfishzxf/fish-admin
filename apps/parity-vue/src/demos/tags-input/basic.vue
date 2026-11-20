<script lang="ts">
export default { name: 'TagsInputBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { TagsInput } from '@fish-admin/vue'

const tags = ref<string[]>(['billing', 'p1'])
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Incident labels</p>
    <TagsInput
      v-model="tags"
      aria-label="Incident labels"
      placeholder="Add a label and press Enter"
      :max="5"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{
        tags.length > 0
          ? `${tags.length} label(s), used to filter the on-call report.`
          : 'No labels yet. Type one and press Enter.'
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      <code>Enter</code> or a comma commits the draft; pasting <code>a,b,c</code> splits into
      separate tags, and <code>Backspace</code> on an empty input removes the last one.
    </p>
  </div>
</template>
