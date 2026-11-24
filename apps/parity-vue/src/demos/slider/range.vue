<script lang="ts">
export default { name: 'SliderRange' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Slider } from '@fish-admin/vue'

// The Vue Slider is a single native range input, so the React two-thumb range
// becomes two linked inputs sharing one model.
const priceMin = ref(120)
const priceMax = ref(480)
const discount = ref(25)

const priceText = computed(() => `$${priceMin.value} – $${priceMax.value}`)
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <div class="fish-demo-row" style="justify-content: space-between; width: 300px">
        <span class="fish-demo-label">Price range</span>
        <span style="font-variant-numeric: tabular-nums; font-weight: 500">{{ priceText }}</span>
      </div>
      <div style="width: 300px; margin-top: 0.5rem" class="fish-demo-stack">
        <Slider v-model="priceMin" :min="0" :max="1000" :step="10" aria-label="Minimum price" />
        <Slider v-model="priceMax" :min="0" :max="1000" :step="10" aria-label="Maximum price" />
      </div>
      <p class="fish-demo-muted" style="margin: 0.5rem 0 0">
        Two inputs share one model pair — the React surface renders this as a two-thumb track.
      </p>
    </div>

    <div>
      <div class="fish-demo-row" style="justify-content: space-between; width: 300px">
        <span class="fish-demo-label">Team discount</span>
        <span style="font-variant-numeric: tabular-nums; font-weight: 500"> {{ discount }}% </span>
      </div>
      <div style="width: 300px; margin-top: 0.5rem">
        <Slider v-model="discount" :min="0" :max="100" :step="25" aria-label="Team discount" />
      </div>
      <p class="fish-demo-muted" style="margin: 0.5rem 0 0">
        <code>step=25</code> snaps the value to 0, 25, 50, 75 or 100 — every arrow-key press moves
        one step.
      </p>
    </div>
  </div>
</template>
