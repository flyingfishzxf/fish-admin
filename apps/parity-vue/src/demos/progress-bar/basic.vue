<script lang="ts">
export default { name: 'ProgressBarBasic' }
</script>

<script setup lang="ts">
import { ProgressBar } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <ProgressBar :value="72" ariaLabel="Storage used" />
    <p class="fish-demo-muted" style="margin: 0">
      A thin determinate bar for tight layouts such as table footers and card headers; use
      <code>Progress</code> when you need a taller track.
    </p>
  </div>
</template>
