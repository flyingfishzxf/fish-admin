<script lang="ts">
export default { name: 'ResultStates' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, Result, type ResultStatus, toast } from '@fish-admin/vue'

const STATUSES: {
  value: ResultStatus
  label: string
  title: string
  description: string
}[] = [
  {
    value: 'success',
    label: 'Success',
    title: 'Deployment finished',
    description: 'Version 2.4.1 is live on production in all three regions.',
  },
  {
    value: 'info',
    label: 'Info',
    title: 'Invitation pending',
    description: 'Mina Park has not accepted yet. The link expires in six days.',
  },
  {
    value: 'warning',
    label: 'Warning',
    title: 'Two seats left',
    description: 'The Growth plan is nearly full. Add seats before inviting more members.',
  },
  {
    value: 'error',
    label: 'Error',
    title: 'Payment failed',
    description: 'The card ending in 4242 was declined. Update it to keep the workspace active.',
  },
  {
    value: 'not-found',
    label: 'Not found',
    title: 'No audit entry here',
    description: 'The record may have been archived. Search the audit log by actor instead.',
  },
]

const status = ref<ResultStatus>('error')
const active = computed(() => STATUSES.find((item) => item.value === status.value) ?? STATUSES[0])
</script>

<template>
  <div class="fish-demo-stack" style="max-width: none">
    <div class="fish-demo-row" role="group" aria-label="Result status examples">
      <Button
        v-for="item in STATUSES"
        :key="item.value"
        size="sm"
        :variant="item.value === status ? 'default' : 'outline'"
        :aria-pressed="item.value === status"
        @click="status = item.value"
      >
        {{ item.label }}
      </Button>
    </div>
    <Result :status="active.value" :title="active.title" :description="active.description">
      <template #extra>
        <Button variant="outline" size="sm" @click="toast('Retry belongs to your flow.')">
          Try again
        </Button>
      </template>
    </Result>
    <p class="fish-demo-muted">
      The error variant renders with role="alert"; every other status uses role="status".
    </p>
  </div>
</template>
