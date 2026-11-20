<script lang="ts">
export default { name: 'JsonViewerStates' }
</script>

<script setup lang="ts">
import { JsonViewer } from '@fish-admin/vue'

const ORG_SETTINGS = {
  org: {
    id: 'org_77',
    name: 'Fish Admin',
    plan: 'enterprise',
    seats: 240,
    sso: { provider: 'okta', enforced: true },
  },
}
</script>

<template>
  <div class="fish-demo-stack">
    <div style="display: grid; gap: 0.375rem">
      <span class="fish-demo-label">Missing payload — undefined renders the empty state</span>
      <JsonViewer ariaLabel="Webhook payload" />
    </div>
    <div style="display: grid; gap: 0.375rem">
      <span class="fish-demo-label">
        Collapsed on arrival — defaultExpandedDepth 0 keeps the root folded
      </span>
      <JsonViewer
        :value="ORG_SETTINGS"
        ariaLabel="Organization settings"
        :default-expanded-depth="0"
      />
    </div>
    <p class="fish-demo-muted">
      “No data” is the empty state, not an error; a null value would instead be drawn as{' '}
      <code>null</code>.
    </p>
  </div>
</template>
