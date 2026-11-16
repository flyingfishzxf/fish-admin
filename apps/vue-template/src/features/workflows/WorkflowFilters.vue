<script setup lang="ts">
import type { WorkflowStatus, WorkflowType } from '@fish-admin/contracts'
import {
  Button,
  DateRangePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type DateRangeValue,
} from '@fish-admin/vue'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useT } from '../../lib/i18n'
import { workflowInitiatorOptionsQueryOptions } from './queries'
import {
  WORKFLOW_STATUSES,
  WORKFLOW_TYPES,
  workflowRangePreset,
  type WorkflowRangePreset,
  type WorkflowSearch,
} from './search'

const props = defineProps<{ search: WorkflowSearch; showClear: boolean }>()
const emit = defineEmits<{ change: [patch: Partial<WorkflowSearch>]; clear: [] }>()

const t = useT('workflows')
const initiators = useQuery(workflowInitiatorOptionsQueryOptions)

const PRESET_ORDER: WorkflowRangePreset[] = ['today', 'last7', 'last30', 'last90', 'thisMonth']

const presets = computed(() =>
  PRESET_ORDER.map((preset) => ({
    label: t(`presets.${preset}`),
    ...workflowRangePreset(preset),
  })),
)

const range = computed<DateRangeValue>({
  get: () => ({ from: props.search.from, to: props.search.to }),
  set: (value) => emit('change', { from: value.from, to: value.to, page: 1 }),
})

function setStatus(value: string) {
  emit('change', { status: value === 'all' ? undefined : (value as WorkflowStatus), page: 1 })
}

function setType(value: string) {
  emit('change', { type: value === 'all' ? undefined : (value as WorkflowType), page: 1 })
}

function setInitiator(value: string) {
  emit('change', { initiatorId: value === 'all' ? undefined : value, page: 1 })
}

const statusLabel = computed(() =>
  props.search.status ? t(`status.${props.search.status}`) : undefined,
)
const typeLabel = computed(() => (props.search.type ? t(`types.${props.search.type}`) : undefined))
const initiatorLabel = computed(
  () => initiators.data.value?.find((entry) => entry.id === props.search.initiatorId)?.name,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" data-workflow-filters>
    <Select
      :model-value="props.search.status ?? 'all'"
      @update:modelValue="setStatus(String($event))"
    >
      <SelectTrigger class="h-9 w-[10rem]" :aria-label="t('filters.status')" data-filter-status>
        <SelectValue :label="statusLabel" :placeholder="t('filters.allStatuses')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ t('filters.allStatuses') }}</SelectItem>
        <SelectItem v-for="status in WORKFLOW_STATUSES" :key="status" :value="status">
          {{ t(`status.${status}`) }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Select :model-value="props.search.type ?? 'all'" @update:modelValue="setType(String($event))">
      <SelectTrigger class="h-9 w-[9.5rem]" :aria-label="t('filters.type')" data-filter-type>
        <SelectValue :label="typeLabel" :placeholder="t('filters.allTypes')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ t('filters.allTypes') }}</SelectItem>
        <SelectItem v-for="type in WORKFLOW_TYPES" :key="type" :value="type">
          {{ t(`types.${type}`) }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Select
      :model-value="props.search.initiatorId ?? 'all'"
      @update:modelValue="setInitiator(String($event))"
    >
      <SelectTrigger
        class="h-9 w-[11rem]"
        :aria-label="t('filters.initiator')"
        data-filter-initiator
      >
        <SelectValue :label="initiatorLabel" :placeholder="t('filters.allInitiators')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{{ t('filters.allInitiators') }}</SelectItem>
        <SelectItem
          v-for="person in initiators.data.value ?? []"
          :key="person.id"
          :value="person.id"
        >
          {{ person.name }}
        </SelectItem>
      </SelectContent>
    </Select>

    <DateRangePicker
      v-model="range"
      :placeholder="t('filters.dateRange')"
      :ariaLabel="t('filters.dateRange')"
      :presets="presets"
      class="h-9 w-full sm:w-[15rem]"
      data-filter-range
    />

    <Button
      v-if="props.showClear"
      variant="ghost"
      size="sm"
      class="h-9"
      data-clear-filters
      @click="emit('clear')"
    >
      {{ t('filters.clear') }}
    </Button>
  </div>
</template>
