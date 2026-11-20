<script lang="ts">
export default { name: 'CollapsibleBasic' }
</script>

<script setup lang="ts">
import { Checkbox, Collapsible, Label } from '@fish-admin/vue'
</script>

<template>
  <Collapsible
    title="Advanced retention settings"
    description="Control how long exports and audit events are kept."
  >
    <div class="fish-demo-stack">
      <div class="fish-demo-row" style="gap: 0.5rem">
        <Checkbox id="demo-retention-exports" :model-value="true" />
        <Label for="demo-retention-exports" style="font-weight: 400">
          Keep CSV exports for 30 days
        </Label>
      </div>
      <div class="fish-demo-row" style="gap: 0.5rem">
        <Checkbox id="demo-retention-audit" :model-value="true" />
        <Label for="demo-retention-audit" style="font-weight: 400">
          Retain audit events for 12 months
        </Label>
      </div>
    </div>
  </Collapsible>
</template>
