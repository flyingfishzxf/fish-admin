<script lang="ts">
export default { name: 'AutoCompleteStates' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AutoComplete, type AutoCompleteOption } from '@fish-admin/vue'

const TEAMS: AutoCompleteOption[] = [
  { value: 'platform', label: 'Platform', description: 'Runtime and infrastructure' },
  { value: 'payments', label: 'Payments', description: 'Checkout and billing' },
  { value: 'growth', label: 'Growth', description: 'Onboarding experiments' },
]

const pending = ref('')
const query = ref('Nightingale')
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <label for="demo-autocomplete-loading" class="fish-demo-label">Loading results</label>
      <AutoComplete
        id="demo-autocomplete-loading"
        :options="[]"
        :value="pending"
        loading
        loading-label="Searching the directory…"
        placeholder="Type a team"
        ariaLabel="Team search, loading"
        class="fish-demo-w-72"
        @update:value="pending = $event"
      />
    </div>
    <div>
      <p class="fish-demo-label">Read-only assignment</p>
      <AutoComplete
        :options="TEAMS"
        value="Platform"
        disabled
        placeholder="No owner"
        ariaLabel="Team search, disabled"
        class="fish-demo-w-72"
      />
    </div>
    <div>
      <label for="demo-autocomplete-empty" class="fish-demo-label">No results yet</label>
      <AutoComplete
        id="demo-autocomplete-empty"
        :options="TEAMS"
        :value="query"
        placeholder="Type a team"
        ariaLabel="Team search, empty state"
        empty-label="No team matches that name"
        class="fish-demo-w-72"
        @update:value="query = $event"
      />
    </div>
    <p class="fish-demo-muted">
      The first field stays in its loading row, the second is disabled, the third starts on a
      query that matches nothing.
    </p>
  </div>
</template>
