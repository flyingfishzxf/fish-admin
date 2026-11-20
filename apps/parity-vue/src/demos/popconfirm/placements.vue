<script lang="ts">
export default { name: 'PopconfirmPlacements' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Popconfirm } from '@fish-admin/vue'
import { Archive, KeyRound, Play } from 'lucide-vue-next'

const status = ref('Nothing has changed yet.')
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Popconfirm
        side="right"
        title="Revoke the CI token?"
        description="Pipelines authenticating with this token fail on their next run."
        confirm-label="Revoke token"
        destructive
        @confirm="status = 'CI token revoked; deploys are paused.'"
      >
        <template #trigger>
          <Button type="button" size="sm" variant="destructive">
            <KeyRound aria-hidden="true" />
            Revoke token
          </Button>
        </template>
      </Popconfirm>

      <Popconfirm
        side="bottom"
        align="start"
        title="Archive this workflow?"
        description="It stops running on schedule but keeps its run history."
        confirm-label="Archive"
        cancel-label="Leave active"
        @confirm="status = 'Workflow archived.'"
      >
        <template #trigger>
          <Button type="button" size="sm" variant="outline">
            <Archive aria-hidden="true" />
            Archive workflow
          </Button>
        </template>
      </Popconfirm>

      <Popconfirm
        side="top"
        align="end"
        title="Re-run the failed job?"
        description="The job starts again with the same commit and environment."
        confirm-label="Re-run job"
        @confirm="status = 'Re-run queued; job 4812 restarts in a few seconds.'"
      >
        <template #trigger>
          <Button type="button" size="sm" variant="outline">
            <Play aria-hidden="true" />
            Re-run job
          </Button>
        </template>
      </Popconfirm>
    </div>
    <p class="fish-demo-muted" role="status">{{ status }}</p>
    <p class="fish-demo-muted">
      side and align only set the preferred placement; the popover flips when there is no room.
    </p>
  </div>
</template>
