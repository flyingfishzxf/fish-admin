<script lang="ts">
export default { name: 'PageHeaderPlain' }
</script>

<script setup lang="ts">
import { PageHeader } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <PageHeader title="Audit log" description="Every privileged change, retained for 12 months." />
    <p class="fish-demo-muted">
      Without an eyebrow or actions the header collapses to a title and its description — the
      lightest possible page opening.
    </p>
  </div>
</template>
