<script lang="ts">
export default { name: 'SeparatorBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Separator } from '@fish-admin/vue'

const showPayment = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <span class="fish-demo-label">Invoice</span>
      <span>INV-1042 · due November 3, 2026</span>
    </div>
    <Separator />
    <div class="fish-demo-row">
      <span class="fish-demo-label">Subtotal</span>
      <span>$1,240.00</span>
    </div>
    <div class="fish-demo-row">
      <span class="fish-demo-label">Tax</span>
      <span>$99.20</span>
    </div>
    <div class="fish-demo-row">
      <strong>Total</strong>
      <strong>$1,339.20</strong>
    </div>
    <template v-if="showPayment">
      <Separator />
      <div class="fish-demo-row">
        <span class="fish-demo-label">Paid with</span>
        <span>Visa ending 4242</span>
      </div>
      <div class="fish-demo-row">
        <span class="fish-demo-label">Captured</span>
        <span>October 27, 2026</span>
      </div>
    </template>
    <Button size="sm" variant="ghost" @click="showPayment = !showPayment">
      {{ showPayment ? 'Hide payment details' : 'Show payment details' }}
    </Button>
    <p class="fish-demo-muted" style="margin: 0">
      Both rules are decorative, so screen readers skip them; they only separate the sections
      visually.
    </p>
  </div>
</template>
