<script lang="ts">
export default { name: 'JsonViewerBasic' }
</script>

<script setup lang="ts">
import { JsonViewer } from '@fish-admin/vue'

const AUDIT_EVENT = {
  id: 'evt_01HQ9Z3K2M',
  action: 'role.assigned',
  actor: { id: 'usr_1042', email: 'ada@fish.dev', role: 'admin' },
  target: { type: 'user', id: 'usr_2087', email: 'grace@fish.dev' },
  changes: { before: ['viewer'], after: ['viewer', 'auditor'] },
  context: { ip: '203.0.113.24', region: 'eu-west-1', mfa: true },
  retried: false,
  reason: null,
}
</script>

<template>
  <div class="fish-demo-stack">
    <JsonViewer :value="AUDIT_EVENT" ariaLabel="Audit event payload" />
    <p class="fish-demo-muted">
      Two levels open by default. Each chevron is a button, and Copy writes the whole event as
      pretty-printed JSON.
    </p>
  </div>
</template>
