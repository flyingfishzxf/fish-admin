<script lang="ts">
export default { name: 'ToggleGroupMultiple' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Toggle, ToggleGroup } from '@fish-admin/vue'
import { Bold, Italic, Underline } from 'lucide-vue-next'

const formats = ref<string[]>(['bold'])
const CHANNELS = ['Email', 'Slack', 'SMS']
const channels = ref<string[]>(['Email'])
</script>

<template>
  <div class="fish-demo-stack">
    <div style="width: 320px">
      <ToggleGroup v-model="formats" type="multiple" aria-label="Text formatting">
        <Toggle value="bold"><Bold /> Bold</Toggle>
        <Toggle value="italic"><Italic /> Italic</Toggle>
        <Toggle value="underline"><Underline /> Underline</Toggle>
      </ToggleGroup>
    </div>
    <div style="width: 320px">
      <ToggleGroup
        v-model="channels"
        type="multiple"
        :spacing="1"
        aria-label="Notification channels"
      >
        <Toggle v-for="channel in CHANNELS" :key="channel" :value="channel" variant="outline">
          {{ channel }}
        </Toggle>
      </ToggleGroup>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      <code>type="multiple"</code> keeps an array; any combination, including none, is valid. The
      second group uses the outline variant per item, separated instead of joined.
    </p>
    <p class="fish-demo-muted" style="margin: 0" aria-live="polite">
      Formats: {{ formats.join(', ') || 'none' }} · Channels: {{ channels.join(', ') || 'none' }}
    </p>
  </div>
</template>
