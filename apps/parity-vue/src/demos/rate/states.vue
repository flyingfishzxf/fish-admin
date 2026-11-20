<script lang="ts">
export default { name: 'RateStates' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Rate } from '@fish-admin/vue'

const value = ref(4)
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <p class="fish-demo-label">Editable: click the fourth star again to clear it.</p>
      <div class="fish-demo-row">
        <Rate :value="value" ariaLabel="Editable quality rating" @change="value = $event" />
        <span class="fish-demo-muted" aria-live="polite">
          {{ value > 0 ? `${value} of 5 stars` : 'Not rated' }}
        </span>
      </div>
    </div>
    <div>
      <p class="fish-demo-label">Read-only: average of 128 review scores.</p>
      <div class="fish-demo-row">
        <Rate :value="4" read-only ariaLabel="Average quality rating" />
        <span class="fish-demo-muted">4.0 out of 5</span>
      </div>
    </div>
  </div>
</template>
