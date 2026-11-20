<script lang="ts">
export default { name: 'SegmentedBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Segmented } from '@fish-admin/vue'

const view = ref('members')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label">Workspace</span>
      <Segmented
        aria-label="Workspace view"
        v-model="view"
        :options="[
          { value: 'members', label: 'Members' },
          { value: 'invoices', label: 'Invoices' },
        ]"
      />
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        view === 'members'
          ? 'Showing 12 members, 2 with pending invitations.'
          : 'Showing 4 invoices, the latest one still open.'
      }}
    </p>
  </div>
</template>
