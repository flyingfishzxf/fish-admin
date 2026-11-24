<script lang="ts">
export default { name: 'RateBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Rate } from '@fish-admin/vue'

const value = ref(3)
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label">How would you rate the onboarding call?</p>
    <div class="fish-demo-row">
      <Rate :value="value" ariaLabel="Onboarding call rating" @change="value = $event" />
      <span class="fish-demo-muted" aria-live="polite">
        {{ value > 0 ? `${value} of 5 stars` : 'No rating yet' }}
      </span>
    </div>
    <p class="fish-demo-muted">
      The score is owned by the page; Rate only reports the star that was picked.
    </p>
  </div>
</template>
