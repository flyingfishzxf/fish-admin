<script lang="ts">
export default { name: 'InputOtpResend' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, OtpInput } from '@fish-admin/vue'

const code = ref('')
const notice = ref('')
const completed = ref('')

function handleChange(next: string) {
  code.value = next
  notice.value = ''
  if (next.length < 6) completed.value = ''
}

function resend() {
  code.value = ''
  completed.value = ''
  notice.value = 'A new code is on its way.'
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <span class="fish-demo-label">Check your email</span>
      <p class="fish-demo-muted" style="margin: 0">
        A six-digit code was sent to ada@acme.dev. It expires in 10 minutes.
      </p>
      <OtpInput
        :model-value="code"
        :length="6"
        aria-label="Six-digit verification code"
        @update:model-value="handleChange"
        @complete="(value) => (completed = String(value))"
      />
      <div class="fish-demo-row">
        <Button type="button" variant="ghost" size="sm" @click="resend">Resend code</Button>
        <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
          {{
            notice ||
            (completed
              ? `Code ${completed} accepted. Signing you in…`
              : 'Didn’t get it? Resend, or check your spam folder.')
          }}
        </p>
      </div>
    </div>
  </div>
</template>
