<script lang="ts">
export default { name: 'QueryFilterBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button, QueryFilter, type FilterField, type FilterValue } from '@fish-admin/vue'

const FIELDS: FilterField[] = [
  { type: 'text', name: 'keyword', label: 'Keyword', placeholder: 'Project or owner name' },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    allLabel: 'All statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  { type: 'boolean', name: 'overdue', label: 'Only overdue tasks' },
]

const value = ref<FilterValue>({})
const applied = ref<FilterValue | null>(null)

const activeCount = computed(
  () =>
    Object.values(value.value).filter(
      (entry) => entry !== undefined && entry !== null && entry !== '' && entry !== false,
    ).length,
)
</script>

<template>
  <div class="fish-demo-stack">
    <QueryFilter
      :fields="FIELDS"
      :value="value"
      :labels="{ reset: 'Clear filters', more: 'More filters', less: 'Fewer filters' }"
      @change="value = $event"
      @reset="value = {}"
    >
      <template #extra>
        <Button size="sm" @click="applied = { ...value }">Apply to list</Button>
      </template>
    </QueryFilter>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{
        activeCount === 0
          ? 'No filters active — the list shows every project.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} active.`
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      {{
        applied
          ? `Applied: ${JSON.stringify(applied)}`
          : 'Nothing applied yet; typing a keyword only stages the value.'
      }}
    </p>
  </div>
</template>
