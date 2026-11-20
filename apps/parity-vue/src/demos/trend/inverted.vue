<script lang="ts">
export default { name: 'TrendInverted' }
</script>

<script setup lang="ts">
import { Trend } from '@fish-admin/vue'
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label">Cost per order</span>
      <Trend :value="-0.6" label="vs last month" invert />
    </div>
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label">Bounce rate</span>
      <Trend :value="-1.25" label="vs last month" suffix=" pt" :precision="2" invert />
    </div>
    <div class="fish-demo-row" style="justify-content: space-between">
      <span class="fish-demo-label">Failed logins</span>
      <Trend :value="4.2" label="vs last month" invert />
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      With <code>invert</code>, the arrow still follows the sign, but the tone flips: churn
      dropping 0.6% reads as a success, while failed logins rising 4.2% turns destructive. Bounce
      rate prints <code>-1.25 pt</code> thanks to <code>suffix</code> and <code>precision</code>.
    </p>
  </div>
</template>
