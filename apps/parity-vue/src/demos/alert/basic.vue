<script lang="ts">
export default { name: 'AlertBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Alert, Button } from '@fish-admin/vue'
import { ShieldCheck } from 'lucide-vue-next'

const requested = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <Alert :icon="ShieldCheck" title="Service tokens must be rotated">
      <p style="margin: 0">
        Tokens issued before October 1 stop working in 3 days. Rotate them to keep CI deployments
        running.
      </p>
      <Button size="sm" :variant="requested ? 'ghost' : 'outline'" @click="requested = !requested">
        {{ requested ? 'Cancel request' : 'Request rotation' }}
      </Button>
      <p class="fish-demo-muted" style="margin: 0">
        {{ requested ? 'Rotation requested for 9 tokens.' : '9 tokens are affected.' }}
      </p>
    </Alert>
    <p class="fish-demo-muted" style="margin: 0">
      The alert is mounted with the page, so it announces itself as soon as the preview renders.
    </p>
  </div>
</template>
