<script lang="ts">
export default { name: 'LabelBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Input, Label } from '@fish-admin/vue'

const endpoint = ref('https://hooks.acme.dev/audit')
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <Label for="demo-label-webhook">Webhook URL</Label>
      <Input id="demo-label-webhook" v-model="endpoint" style="margin-top: 0.5rem" />
      <p class="fish-demo-muted" style="margin: 0.5rem 0 0">
        Selecting the label moves focus into the input, because its for attribute matches the input
        id.
      </p>
      <p class="fish-demo-muted" style="margin: 0.25rem 0 0">Value: {{ endpoint || '(empty)' }}</p>
    </div>
  </div>
</template>
