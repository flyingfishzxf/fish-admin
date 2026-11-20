<script lang="ts">
export default { name: 'SpinnerBasic' }
</script>

<script setup lang="ts">
import { Spinner } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Spinner size="sm" />
      <span class="fish-demo-label">sm — 14 px, for buttons and dense rows</span>
    </div>
    <div class="fish-demo-row">
      <Spinner />
      <span class="fish-demo-label">default — 16 px, for cards and panels</span>
    </div>
    <div class="fish-demo-row">
      <Spinner size="lg" />
      <span class="fish-demo-label">lg — 24 px, for a first full-panel load</span>
    </div>
  </div>
</template>
