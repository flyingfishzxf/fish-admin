<script lang="ts">
export default { name: 'InputBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Input, Label } from '@fish-admin/vue'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const email = ref('')
const valid = computed(() => EMAIL_PATTERN.test(email.value))
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-email">Work email</Label>
      <Input
        id="demo-input-email"
        v-model="email"
        type="email"
        autocomplete="email"
        placeholder="name@company.com"
        aria-describedby="demo-input-email-hint"
      />
      <p id="demo-input-email-hint" class="fish-demo-muted">
        {{
          email.length === 0
            ? 'Used only for workspace invitations.'
            : valid
              ? `Invitations will be sent to ${email}.`
              : 'Keep typing — an address needs an @ and a domain.'
        }}
      </p>
    </div>
  </div>
</template>
