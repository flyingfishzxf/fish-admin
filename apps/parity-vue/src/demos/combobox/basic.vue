<script lang="ts">
export default { name: 'ComboboxBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Combobox, type ComboboxOption } from '@fish-admin/vue'

const TEAMS: ComboboxOption[] = [
  {
    value: 'platform',
    label: 'Platform',
    description: 'Runtime, deploy pipeline and observability',
  },
  {
    value: 'product',
    label: 'Product',
    description: 'Core workspace, reporting and billing surfaces',
  },
  {
    value: 'design',
    label: 'Design',
    description: 'Design system and interaction patterns',
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Escalations and customer onboarding',
  },
]

const team = ref<string | null>('platform')
const selected = computed(() => TEAMS.find((option) => option.value === team.value))
</script>

<template>
  <div class="fish-demo-stack">
    <p class="fish-demo-label" style="margin: 0">Owning team</p>
    <Combobox
      :options="TEAMS"
      :value="team"
      placeholder="Assign a team"
      searchPlaceholder="Search teams"
      ariaLabel="Owning team"
      clearLabel="Clear owning team"
      @change="team = $event"
      @clear="team = null"
    />
    <p class="fish-demo-muted" aria-live="polite">
      {{
        selected
          ? `${selected.label} — ${selected.description}`
          : 'Unassigned. New incidents will not page anyone.'
      }}
    </p>
  </div>
</template>
