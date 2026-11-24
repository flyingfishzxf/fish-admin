<script lang="ts">
export default { name: 'CheckboxBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Checkbox, Label } from '@fish-admin/vue'

const updates = ref(true)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row" style="align-items: flex-start">
      <Checkbox
        id="demo-checkbox-updates"
        v-model="updates"
        aria-describedby="demo-checkbox-updates-description"
      />
      <div>
        <Label for="demo-checkbox-updates">Product updates</Label>
        <p
          id="demo-checkbox-updates-description"
          class="fish-demo-muted"
          style="margin: 0.35rem 0 0"
        >
          A monthly summary of shipped changes. No marketing email.
        </p>
      </div>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      Product updates are {{ updates ? 'on' : 'off' }}.
    </p>
  </div>
</template>
