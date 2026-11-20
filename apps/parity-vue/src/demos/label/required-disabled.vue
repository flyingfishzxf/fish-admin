<script lang="ts">
export default { name: 'LabelRequiredDisabled' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Input, Label } from '@fish-admin/vue'

const owner = ref('')
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <Label for="demo-label-owner">Owner email <span aria-hidden="true">*</span></Label>
      <Input
        id="demo-label-owner"
        v-model="owner"
        required
        type="email"
        placeholder="owner@company.com"
        style="margin-top: 0.5rem"
      />
      <p class="fish-demo-muted" style="margin: 0.5rem 0 0">
        {{
          owner.trim() === ''
            ? 'The asterisk is decorative; the input carries required, so a native form blocks submit while this is empty.'
            : 'The input has a value, so the required check passes.'
        }}
      </p>
    </div>
    <div>
      <Label for="demo-label-billing" style="opacity: 0.5">Billing email</Label>
      <Input
        id="demo-label-billing"
        type="email"
        model-value="finance@acme.dev"
        disabled
        style="margin-top: 0.5rem"
      />
      <p class="fish-demo-muted" style="margin: 0.5rem 0 0">
        Managed by the billing provider, so the field stays visible but disabled.
      </p>
    </div>
  </div>
</template>
