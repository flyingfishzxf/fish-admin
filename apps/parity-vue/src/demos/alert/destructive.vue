<script lang="ts">
export default { name: 'AlertDestructive' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Alert, Button } from '@fish-admin/vue'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-vue-next'

const FAILURES = [
  { job: 'Nightly invoice export', detail: 'stalled at 02:14' },
  { job: 'Webhook retries for eu-west', detail: '42 events undelivered' },
  { job: 'SSO metadata refresh', detail: 'signing certificate expired' },
]

const healthy = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <Alert
      :variant="healthy ? 'default' : 'destructive'"
      :icon="healthy ? CheckCircle2 : AlertTriangle"
      :title="healthy ? 'All jobs are healthy' : '3 background jobs failed'"
    >
      <p v-if="healthy" style="margin: 0">
        The re-run finished without errors on October 27, 2026 at 10:05.
      </p>
      <template v-else>
        <p style="margin: 0">
          These jobs stopped before completing, so downstream reports are incomplete:
        </p>
        <ul class="fish-demo-stack" style="gap: 4px; margin: 0; padding: 0; list-style: none">
          <li v-for="failure in FAILURES" :key="failure.job" class="fish-demo-row" style="gap: 6px">
            <XCircle aria-hidden="true" :size="14" />
            <span>{{ failure.job }}</span>
            <span>({{ failure.detail }})</span>
          </li>
        </ul>
      </template>
      <Button size="sm" variant="outline" @click="healthy = !healthy">
        {{ healthy ? 'Show the failed run' : 'Re-run checks' }}
      </Button>
    </Alert>
    <p class="fish-demo-muted" style="margin: 0">
      Each click alternates between a failed run and a clean re-run so both variants can be
      compared.
    </p>
  </div>
</template>
