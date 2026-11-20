<script lang="ts">
export default { name: 'CardBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Badge, Button, Card, Progress } from '@fish-admin/vue'
import { Star } from 'lucide-vue-next'

const TOTAL_TASKS = 20

const completed = ref(12)
const following = ref(false)
const percent = computed(() => Math.round((completed.value / TOTAL_TASKS) * 100))
</script>

<template>
  <Card
    class="fish-demo-w-72"
    title="Atlas redesign"
    description="Marketing site refresh for the Atlas launch."
  >
    <div class="flex items-center justify-between gap-3">
      <Badge variant="secondary">In progress</Badge>
      <span class="fish-demo-muted">{{ completed }} / {{ TOTAL_TASKS }} tasks</span>
    </div>
    <Progress :value="percent" :aria-label="`Atlas redesign ${percent}% complete`" />
    <p class="fish-demo-muted" style="margin: 0">Due 2026-10-30 · Owner Design guild</p>
    <template #footer>
      <div class="flex gap-2">
        <Button
          size="sm"
          :disabled="completed >= TOTAL_TASKS"
          @click="completed = Math.min(TOTAL_TASKS, completed + 1)"
        >
          Log a task
        </Button>
        <Button size="sm" variant="ghost" :aria-pressed="following" @click="following = !following">
          <Star :size="16" />
          {{ following ? 'Following' : 'Follow' }}
        </Button>
      </div>
    </template>
  </Card>
</template>
