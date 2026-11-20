<script lang="ts">
export default { name: 'CollapsibleChevron' }
</script>

<script setup lang="ts">
import { Collapsible } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <Collapsible
      title="Export details"
      description="workspace-members-2026-10.csv · 1,284 rows · generated 12 minutes ago"
      default-open
    >
      <p class="fish-demo-muted" style="margin: 0">
        Downloads expire after 30 days. Regenerate at any time from Reports.
      </p>
    </Collapsible>
    <p class="fish-demo-muted">
      The chevron rotates with the open state; this panel starts expanded via
      <code>default-open</code>.
    </p>
  </div>
</template>
