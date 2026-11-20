<script lang="ts">
export default { name: 'BadgeStatus' }
</script>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'

import { Badge, Button } from '@fish-admin/vue'
import { CheckCircle2, Clock, XCircle } from 'lucide-vue-next'

type BadgeVariant = 'default' | 'secondary' | 'destructive'

const STATUSES: Array<{
  id: string
  label: string
  variant: BadgeVariant
  icon: Component
  hint: string
}> = [
  {
    id: 'active',
    label: 'Active',
    variant: 'default',
    icon: CheckCircle2,
    hint: 'Billing is current, so seats can be added at any time.',
  },
  {
    id: 'trial',
    label: 'Trial',
    variant: 'secondary',
    icon: Clock,
    hint: '14 days remain in the trial; invited members do not count yet.',
  },
  {
    id: 'past-due',
    label: 'Past due',
    variant: 'destructive',
    icon: XCircle,
    hint: 'The card ending 4242 was declined three days ago.',
  },
]

const status = ref('active')
const current = computed(() => STATUSES.find((item) => item.id === status.value) ?? STATUSES[0])
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Badge :variant="current.variant">
        <span aria-hidden="true" style="font-size: 0.45rem; line-height: 1">●</span>
        <component :is="current.icon" aria-hidden="true" />
        {{ current.label }}
      </Badge>
      <span class="fish-demo-muted">{{ current.hint }}</span>
    </div>
    <div class="fish-demo-row">
      <Button
        v-for="item in STATUSES"
        :key="item.id"
        size="sm"
        :variant="item.id === status ? 'default' : 'outline'"
        :aria-pressed="item.id === status"
        @click="status = item.id"
      >
        {{ item.label }}
      </Button>
    </div>
    <p class="fish-demo-muted" style="margin: 0">
      The dot is a decorative span; the icon and label carry the meaning, so the badge still reads
      correctly without colour.
    </p>
  </div>
</template>
