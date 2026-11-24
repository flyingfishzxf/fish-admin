<script lang="ts">
export default { name: 'InputOtpBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { OtpInput } from '@fish-admin/vue'

const code = ref('')
const complete = computed(() => code.value.length === 6)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <span class="fish-demo-label">Verification code</span>
      <p class="fish-demo-muted" style="margin: 0">Enter the six digits sent to ada@acme.dev.</p>
      <OtpInput v-model="code" :length="6" aria-label="Six-digit verification code" />
      <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
        {{ complete ? 'Code complete — ready to verify.' : `${code.length} of 6 digits entered.` }}
      </p>
    </div>
  </div>
</template>
