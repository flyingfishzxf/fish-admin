<script lang="ts">
export default { name: 'PopconfirmBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Popconfirm } from '@fish-admin/vue'
import { Trash2 } from 'lucide-vue-next'

const deleted = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Popconfirm
        title="Delete this workflow?"
        description="Runs in progress are cancelled and the history is kept for 30 days."
        confirm-label="Delete workflow"
        cancel-label="Keep workflow"
        destructive
        @confirm="deleted = true"
      >
        <template #trigger>
          <Button type="button" size="sm" variant="destructive">
            <Trash2 aria-hidden="true" />
            Delete workflow
          </Button>
        </template>
      </Popconfirm>
      <p class="fish-demo-muted" role="status" style="margin: 0">
        {{ deleted ? 'Workflow deleted.' : 'The workflow is still active.' }}
      </p>
    </div>
    <p class="fish-demo-muted">
      Escape or “Keep workflow” closes the popover without deleting anything.
    </p>
  </div>
</template>
