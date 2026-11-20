<script lang="ts">
export default { name: 'SheetAnotherSide' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Checkbox, Label, Sheet } from '@fish-admin/vue'

const FILTERS = [
  { key: 'sessions', label: 'Sign-in events' },
  { key: 'billing', label: 'Billing changes' },
  { key: 'permissions', label: 'Permission changes' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

const open = ref(false)
const applied = ref<FilterKey[]>(['sessions'])
const draft = ref<FilterKey[]>(['sessions'])

function handleOpenChange(next: boolean) {
  if (next) draft.value = [...applied.value]
  open.value = next
}

function toggleFilter(key: FilterKey) {
  draft.value = draft.value.includes(key)
    ? draft.value.filter((item) => item !== key)
    : [...draft.value, key]
}

function applyFilters() {
  applied.value = [...draft.value]
  open.value = false
}
</script>

<template>
  <div class="fish-demo-stack">
    <div class="fish-demo-row">
      <Sheet side="bottom" :open="open" @update:open="handleOpenChange">
        <template #trigger>
          <Button variant="outline">Filter activity</Button>
        </template>
        <div style="padding: 0.25rem 0.5rem 1rem">
          <header style="padding: 0.5rem 0.5rem 0.75rem">
            <h2 style="margin: 0; font-size: 1rem; font-weight: 600">Filter activity</h2>
            <p class="fish-demo-muted" style="margin: 0.25rem 0 0">
              Choose which audit events the log shows.
            </p>
          </header>
          <div style="display: grid; gap: 0.75rem; padding: 0 0.5rem">
            <div v-for="filter in FILTERS" :key="filter.key" class="fish-demo-row">
              <Checkbox
                :id="`demo-sheet-filter-${filter.key}`"
                :model-value="draft.includes(filter.key)"
                @update:model-value="toggleFilter(filter.key)"
              />
              <Label :for="`demo-sheet-filter-${filter.key}`">{{ filter.label }}</Label>
            </div>
          </div>
          <footer style="display: flex; gap: 0.5rem; padding: 1rem 0.5rem 0">
            <Button :disabled="draft.length === 0" @click="applyFilters">Apply filters</Button>
            <Button variant="outline" @click="open = false">Cancel</Button>
          </footer>
        </div>
      </Sheet>
      <p class="fish-demo-muted" aria-live="polite">
        {{ applied.length }} of {{ FILTERS.length }} event types shown
      </p>
    </div>
  </div>
</template>
