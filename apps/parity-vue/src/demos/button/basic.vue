<script lang="ts">
export default { name: 'ButtonBasic' }
</script>

<script setup lang="ts">
import { Button } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-row">
    <Button>Create project</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Export</Button>
    <Button variant="ghost">Cancel</Button>
  </div>
</template>
