<script lang="ts">
export default { name: 'AutoCompleteBasic' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { AutoComplete, type AutoCompleteOption } from '@fish-admin/vue'

const REVIEWERS: AutoCompleteOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Engineering · Platform' },
  { value: 'grace', label: 'Grace Hopper', description: 'Engineering · Infrastructure' },
  { value: 'katherine', label: 'Katherine Johnson', description: 'Design · Product systems' },
  { value: 'alan', label: 'Alan Turing', description: 'Product · Growth' },
  {
    value: 'linus',
    label: 'Linus Torvalds',
    description: 'Contractor · access suspended',
    disabled: true,
  },
]

const value = ref('')
const selected = ref<string | null>(null)

function onValueChange(next: string) {
  value.value = next
  selected.value = null
}
</script>

<template>
  <div class="fish-demo-stack">
    <label for="demo-autocomplete-reviewer" class="fish-demo-label">Assign reviewer</label>
    <div class="fish-demo-w-72">
      <AutoComplete
        id="demo-autocomplete-reviewer"
        :options="REVIEWERS"
        :value="value"
        placeholder="Search the directory"
        ariaLabel="Reviewer"
        empty-label="No matching reviewer"
        @update:value="onValueChange"
        @select="selected = $event.label"
      />
    </div>
    <p class="fish-demo-muted" aria-live="polite">
      {{
        selected
          ? `Selected ${selected}`
          : 'Type a name, then pick a suggestion or keep your own text.'
      }}
    </p>
  </div>
</template>
