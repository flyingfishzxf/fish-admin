<script lang="ts">
export default { name: 'SwitchSizes' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Label, Switch } from '@fish-admin/vue'

const digest = ref(true)
const mentions = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="justify-content: space-between">
      <Label for="demo-switch-digest">Weekly digest</Label>
      <Switch id="demo-switch-digest" v-model="digest" />
    </div>
    <div class="fish-demo-row" style="justify-content: space-between">
      <Label for="demo-switch-mentions">Mentions only</Label>
      <Switch id="demo-switch-mentions" v-model="mentions" size="sm" />
    </div>
    <div class="fish-demo-row" style="align-items: flex-start; justify-content: space-between">
      <div>
        <Label for="demo-switch-streaming">Audit log streaming</Label>
        <p class="fish-demo-muted" style="margin: 0.35rem 0 0">
          Disabled because streaming is part of the Enterprise plan.
        </p>
      </div>
      <Switch id="demo-switch-streaming" disabled />
    </div>
    <p class="fish-demo-muted">
      The first row uses the default track (18.4 × 32 px); the second uses <code>size="sm"</code>
      (14 × 24 px).
    </p>
  </div>
</template>
