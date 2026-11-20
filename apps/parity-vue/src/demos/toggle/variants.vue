<script lang="ts">
export default { name: 'ToggleVariants' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Toggle } from '@fish-admin/vue'
import { Archive, Bell, Eye, Pin } from 'lucide-vue-next'

const pinned = ref(true)
const watching = ref(false)
const notify = ref(false)
const archived = ref(false)
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Toggle v-model="pinned" variant="default" aria-label="Pin thread">
        <Pin />
      </Toggle>
      <Toggle v-model="watching" variant="default" aria-label="Watch thread">
        <Eye />
      </Toggle>
      <Toggle v-model="notify" variant="outline" aria-label="Notify me">
        <Bell />
      </Toggle>
      <Toggle v-model="archived" variant="outline" aria-label="Archive">
        <Archive />
      </Toggle>
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      Pinned: {{ pinned ? 'yes' : 'no' }} · Watching: {{ watching ? 'yes' : 'no' }} · Notify:
      {{ notify ? 'yes' : 'no' }} · Archived: {{ archived ? 'yes' : 'no' }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      default fills while pressed; outline keeps the border in both states.
    </p>
  </div>
</template>
