<script lang="ts">
export default { name: 'ButtonStates' }
</script>

<script setup lang="ts">
import { Button, Spinner } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
    <div class="fish-demo-row">
      <Button disabled>Disabled</Button>
      <Button>
        <Spinner class="size-4" />
        Loading
      </Button>
      <Button variant="destructive">Delete</Button>
    </div>
  </div>
</template>
