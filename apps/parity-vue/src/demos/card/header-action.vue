<script lang="ts">
export default { name: 'CardHeaderAction' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Badge, Button, Card } from '@fish-admin/vue'

const enabled = ref(false)
</script>

<template>
  <Card
    class="fish-demo-w-72"
    title="Two-factor authentication"
    description="Require a one-time code when members sign in."
  >
    <template #header>
      <Badge :variant="enabled ? 'secondary' : 'outline'">
        {{ enabled ? 'Enabled' : 'Recommended' }}
      </Badge>
    </template>
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
      {{
        enabled
          ? 'Members confirm each sign-in with their authenticator app.'
          : 'Sign-in currently needs only a password.'
      }}
    </p>
    <template #footer>
      <div class="flex gap-2">
        <Button size="sm" :variant="enabled ? 'outline' : 'default'" @click="enabled = !enabled">
          {{ enabled ? 'Turn off' : 'Enable 2FA' }}
        </Button>
        <span class="fish-demo-muted">Policy updated 2026-09-12</span>
      </div>
    </template>
  </Card>
</template>
