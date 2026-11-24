<script lang="ts">
export default { name: 'QueryFilterCollapsed' }
</script>

<script setup lang="ts">
import { computed, h, ref } from 'vue'

import { Button, Input, QueryFilter, type FilterField, type FilterValue } from '@fish-admin/vue'

const FIELDS: FilterField[] = [
  { type: 'text', name: 'keyword', label: 'Keyword', placeholder: 'Search project name' },
  {
    type: 'select',
    name: 'owner',
    label: 'Owner',
    allLabel: 'Everyone',
    options: [
      { value: 'dana', label: 'Dana Cole' },
      { value: 'mei', label: 'Mei Chen' },
      { value: 'ivo', label: 'Ivo Petersen' },
    ],
  },
  { type: 'boolean', name: 'starred', label: 'Starred projects only' },
  { type: 'dateRange', fromName: 'createdFrom', toName: 'createdTo', label: 'Created between' },
  {
    type: 'custom',
    name: 'minBudget',
    label: 'Minimum budget',
    render: (raw, onValueChange) =>
      h(Input, {
        'aria-label': 'Minimum budget in USD',
        type: 'number',
        min: 0,
        modelValue: typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '',
        'onUpdate:modelValue': (next: string) => onValueChange(next),
        style: { height: '2.25rem' },
      }),
  },
]

const value = ref<FilterValue>({})
const savedView = ref('')

const activeCount = computed(
  () =>
    Object.values(value.value).filter(
      (entry) => entry !== undefined && entry !== null && entry !== '' && entry !== false,
    ).length,
)

function onReset() {
  value.value = {}
  savedView.value = ''
}
</script>

<template>
  <div class="fish-demo-stack">
    <QueryFilter
      :fields="FIELDS"
      :value="value"
      :max-visible="2"
      :labels="{ reset: 'Reset filters', more: 'More filters', less: 'Show fewer' }"
      @change="value = $event"
      @reset="onReset"
    >
      <template #extra>
        <Button variant="outline" size="sm" @click="savedView = JSON.stringify(value)">
          Save view
        </Button>
      </template>
    </QueryFilter>
    <p class="fish-demo-muted" aria-live="polite" style="margin: 0">
      {{
        activeCount === 0
          ? 'No filters set. Expand the bar to reach the date range and budget fields.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} set: ${JSON.stringify(value)}.`
      }}
    </p>
    <p class="fish-demo-muted" style="margin: 0">
      {{
        savedView
          ? `Saved view ${savedView}. Clearing the bar fires reset, which drops the saved view too.`
          : 'Hidden fields keep their values — collapsing the bar is a layout change, not a reset.'
      }}
    </p>
  </div>
</template>
