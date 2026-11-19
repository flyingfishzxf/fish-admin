<script setup lang="ts">
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-vue-next'
import { computed, ref, useId } from 'vue'

import { cn } from '../../lib/utils'
import { clearFilterValues, countActiveFilters } from '../../lib/filter-utils'
import type { FilterField, FilterValue } from '../../lib/query-filter-types'
import { Button } from '../ui/button'
import Input from '../ui/input/Input.vue'
import Label from '../ui/label/Label.vue'
import Select from '../ui/select/Select.vue'
import SelectContent from '../ui/select/SelectContent.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import SelectTrigger from '../ui/select/SelectTrigger.vue'
import SelectValue from '../ui/select/SelectValue.vue'
import Switch from '../ui/switch/Switch.vue'
import DateRangePicker from './date-range-picker/DateRangePicker.vue'

const ALL_OPTION_VALUE = '__query-filter-all__'

const props = withDefaults(
  defineProps<{
    /** Field descriptors; order defines the layout order. */
    fields: FilterField[]
    /** Current filter values, keyed by the field names. */
    value: FilterValue
    /** Visible strings for the reset, expand and collapse buttons. */
    labels: { reset: string; more: string; less: string }
    /** How many fields stay visible while collapsed; defaults to 3. */
    maxVisible?: number
    class?: string
  }>(),
  { maxVisible: 3 },
)

const emit = defineEmits<{
  change: [value: FilterValue]
  reset: []
}>()

defineSlots<{
  extra?(): unknown
  custom?(props: {
    field: FilterField
    value: unknown
    onChange: (value: unknown) => void
  }): unknown
}>()

const expanded = ref(false)
const uid = useId()
const fieldIds = new Map<FilterField, string>()

function fieldId(field: FilterField) {
  if (!fieldIds.has(field)) fieldIds.set(field, `${uid}-${fieldIds.size}`)
  return fieldIds.get(field)!
}

function fieldKey(field: FilterField) {
  return field.type === 'dateRange'
    ? `${field.type}:${field.fromName}:${field.toName}`
    : `${field.type}:${field.name}`
}

const visibleCount = computed(() => Math.max(0, props.maxVisible))
const canExpand = computed(() => props.fields.length > visibleCount.value)
const visibleFields = computed(() =>
  expanded.value ? props.fields : props.fields.slice(0, visibleCount.value),
)
const activeCount = computed(() => countActiveFilters(props.fields, props.value))

function update(name: string, next: unknown) {
  emit('change', { ...props.value, [name]: next })
}

function handleReset() {
  emit('change', clearFilterValues(props.fields))
  emit('reset')
}

function textOf(raw: unknown) {
  return typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
}
</script>

<template>
  <div data-slot="query-filter" :class="cn('flex flex-col gap-3', props.class)">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="field in visibleFields"
        :key="fieldKey(field)"
        data-slot="query-filter-field"
        class="flex min-w-0 flex-col gap-1.5"
      >
        <template v-if="field.type === 'text'">
          <Label :for="fieldId(field)">{{ field.label }}</Label>
          <Input
            :id="fieldId(field)"
            :value="textOf(props.value[field.name])"
            :placeholder="field.placeholder"
            class="h-9"
            @input="update(field.name, ($event.target as HTMLInputElement).value)"
          />
        </template>

        <template v-else-if="field.type === 'select'">
          <Label :for="fieldId(field)">{{ field.label }}</Label>
          <Select
            :model-value="
              textOf(props.value[field.name]) || (field.allLabel ? ALL_OPTION_VALUE : undefined)
            "
            @update:model-value="
              (next) => update(field.name, next === ALL_OPTION_VALUE ? '' : next)
            "
          >
            <SelectTrigger :id="fieldId(field)" :aria-label="field.label" class="h-9 w-full">
              <SelectValue :placeholder="field.allLabel ?? field.label" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-if="field.allLabel" :value="ALL_OPTION_VALUE">
                {{ field.allLabel }}
              </SelectItem>
              <SelectItem v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <template v-else-if="field.type === 'dateRange'">
          <Label>{{ field.label }}</Label>
          <DateRangePicker
            :model-value="{
              from: textOf(props.value[field.fromName]) || undefined,
              to: textOf(props.value[field.toName]) || undefined,
            }"
            :placeholder="field.placeholder ?? field.label"
            :aria-label="field.label"
            :ariaLabel="field.label"
            class="h-9 w-full"
            @update:model-value="
              (range) => {
                emit('change', {
                  ...props.value,
                  [field.fromName]: range.from ?? '',
                  [field.toName]: range.to ?? '',
                })
              }
            "
          />
        </template>

        <template v-else-if="field.type === 'boolean'">
          <Label :for="fieldId(field)">{{ field.label }}</Label>
          <div class="flex h-9 items-center">
            <Switch
              :id="fieldId(field)"
              :model-value="props.value[field.name] === true"
              @update:model-value="update(field.name, $event)"
            />
          </div>
        </template>

        <template v-else>
          <Label>{{ field.label }}</Label>
          <div role="group" :aria-label="field.label" class="min-w-0">
            <slot
              name="custom"
              :field="field"
              :value="props.value[field.name]"
              :on-change="(next: unknown) => update(field.name, next)"
            />
          </div>
        </template>
      </div>
    </div>

    <div
      v-if="canExpand || activeCount > 0 || $slots.extra"
      class="flex flex-wrap items-center gap-2"
    >
      <Button
        v-if="canExpand"
        type="button"
        variant="ghost"
        size="sm"
        class="gap-1.5"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        <ChevronUp v-if="expanded" class="size-4" />
        <ChevronDown v-else class="size-4" />
        {{ expanded ? props.labels.less : props.labels.more }}
      </Button>
      <Button
        v-if="activeCount > 0"
        type="button"
        variant="ghost"
        size="sm"
        class="gap-1.5"
        @click="handleReset"
      >
        <RotateCcw class="size-4" />
        {{ props.labels.reset }}
      </Button>
      <div v-if="$slots.extra" class="ms-auto">
        <slot name="extra" />
      </div>
    </div>
  </div>
</template>
