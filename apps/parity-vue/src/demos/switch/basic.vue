<script lang="ts">
export default { name: 'SwitchBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Label, Switch } from '@fish-admin/vue'

const enforced = ref(true)
</script>

<template>
  <div class="fish-demo-stack">
    <div
      class="fish-demo-row"
      style="
        align-items: flex-start;
        justify-content: space-between;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.75rem;
      "
    >
      <div style="min-width: 0">
        <Label for="demo-switch-2fa">Two-factor authentication</Label>
        <p class="fish-demo-muted" style="margin: 0.35rem 0 0">
          Require a one-time code from an authenticator app at sign-in.
        </p>
        <p
          class="fish-demo-label"
          style="margin: 0.35rem 0 0; color: var(--primary); font-weight: 500"
        >
          {{ enforced ? 'On for all members' : 'Off — password sign-in only' }}
        </p>
      </div>
      <Switch id="demo-switch-2fa" v-model="enforced" />
    </div>
    <p class="fish-demo-muted">
      The switch is controlled: the status line reads the same state the thumb shows.
    </p>
  </div>
</template>
