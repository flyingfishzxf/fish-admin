<script lang="ts">
export default { name: 'CalendarBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Calendar, Card } from '@fish-admin/vue'

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

const date = ref<string | undefined>(new Date().toISOString().slice(0, 10))
</script>

<template>
  <div class="fish-demo-stack">
    <!-- Same composition as the template: Card > Calendar. -->
    <Card class="w-fit">
      <Calendar v-model="date" locale="en-US" />
    </Card>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        date
          ? `Next access review: ${DATE_FORMAT.format(new Date(date))}`
          : 'Pick a date to schedule the review.'
      }}
    </p>
  </div>
</template>
