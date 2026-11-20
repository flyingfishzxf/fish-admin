<script lang="ts">
export default { name: 'BreadcrumbBasic' }
</script>

<script setup lang="ts">
import { Breadcrumb } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <Breadcrumb
      :items="[
        { label: 'Workspace', to: '#workspace' },
        { label: 'Members', to: '#members' },
        { label: 'Ada Lovelace' },
      ]"
    />
    <p class="fish-demo-muted">Member profile nested under Workspace and Members.</p>
  </div>
</template>
