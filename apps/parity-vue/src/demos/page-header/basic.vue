<script lang="ts">
export default { name: 'PageHeaderBasic' }
</script>

<script setup lang="ts">
import { Button, PageHeader } from '@fish-admin/vue'
import { Plus } from 'lucide-vue-next'
</script>

<template>
  <div class="fish-demo-stack">
    <PageHeader
      eyebrow="Projects"
      title="Apollo migration"
      description="Move the remaining v1 services behind the new gateway before the November freeze."
    >
      <template #actions>
        <Button size="sm"><Plus /> New task</Button>
        <Button size="sm" variant="outline">Share</Button>
      </template>
    </PageHeader>
    <p class="fish-demo-muted">
      The header keeps the title block and the actions on one row when there is room, and wraps on
      narrow viewports.
    </p>
  </div>
</template>
