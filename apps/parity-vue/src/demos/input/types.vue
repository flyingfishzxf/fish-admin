<script lang="ts">
export default { name: 'InputTypes' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Input, Label } from '@fish-admin/vue'

const email = ref('ada@fish-admin')
const invalid = computed(() => {
  const domain = email.value.split('@')[1]
  return !email.value.includes('@') || !domain?.includes('.')
})
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-types-text">Project name</Label>
      <Input id="demo-input-types-text" model-value="Apollo migration" />
      <p class="fish-demo-muted">
        Omit <code>type</code> and the native default, text, applies.
      </p>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-types-email">Billing email</Label>
      <Input
        id="demo-input-types-email"
        v-model="email"
        type="email"
        :aria-invalid="invalid || undefined"
        aria-describedby="demo-input-types-email-hint"
      />
      <p id="demo-input-types-email-hint" class="fish-demo-muted">
        {{ invalid ? 'Enter an address like finance@acme.dev.' : 'Invoices are sent to this address.' }}
      </p>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-types-password">Password</Label>
      <Input
        id="demo-input-types-password"
        type="password"
        placeholder="At least 12 characters"
        aria-describedby="demo-input-types-password-hint"
      />
      <p id="demo-input-types-password-hint" class="fish-demo-muted">
        <code>type="password"</code> masks the value while keeping it typeable.
      </p>
    </div>

    <div class="fish-demo-stack" style="gap: 0.4rem">
      <Label for="demo-input-types-disabled" style="opacity: 0.5">Workspace slug</Label>
      <Input id="demo-input-types-disabled" model-value="acme-platform" disabled />
      <p class="fish-demo-muted">
        A disabled field keeps its value visible but is skipped by the Tab order.
      </p>
    </div>
  </div>
</template>
