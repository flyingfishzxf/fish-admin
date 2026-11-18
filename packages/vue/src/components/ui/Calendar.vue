<script setup lang="ts">
import { parseDate, type DateValue } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
} from 'reka-ui'
import { computed } from 'vue'

import { useUITranslation } from '../../i18n'
import { cn } from '../../lib/utils'

const props = defineProps<{
  modelValue: string | undefined
  locale: string
  /** Earliest selectable day as `YYYY-MM-DD`; earlier days are disabled. */
  min?: string
  /** Latest selectable day as `YYYY-MM-DD`; later days are disabled. */
  max?: string
  class?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | undefined] }>()

const { t } = useUITranslation()

const selected = computed<DateValue | undefined>(() =>
  props.modelValue ? parseDate(props.modelValue) : undefined,
)

const disabledMatcher = computed(() => {
  const min = props.min ? parseDate(props.min) : undefined
  const max = props.max ? parseDate(props.max) : undefined
  if (!min && !max) return undefined
  // Reka's Matcher is a predicate, unlike react-day-picker's object matchers.
  return (date: DateValue) => {
    if (min && date.compare(min) < 0) return true
    if (max && date.compare(max) > 0) return true
    return false
  }
})

const navClass =
  'inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'

const cellClass = cn(
  'size-8 rounded-md p-0 text-center text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 data-[today]:bg-accent data-[today]:text-accent-foreground data-[selected]:bg-primary data-[selected]:text-primary-foreground',
)
</script>

<template>
  <CalendarRoot
    :model-value="selected"
    :locale="props.locale"
    :calendar-label="t('calendar.label')"
    :is-date-disabled="disabledMatcher"
    initial-focus
    :class="cn('w-fit bg-background p-3', props.class)"
    @update:model-value="
      (next) => {
        emit('update:modelValue', next?.toString())
      }
    "
  >
    <template #default="{ weekDays, grid }">
      <CalendarHeader class="relative flex w-full items-center justify-between gap-1">
        <CalendarPrev :aria-label="t('calendar.previousMonth')" :class="navClass">
          <ChevronLeftIcon class="size-4" />
        </CalendarPrev>
        <CalendarHeading class="text-sm font-medium select-none" />
        <CalendarNext :aria-label="t('calendar.nextMonth')" :class="navClass">
          <ChevronRightIcon class="size-4" />
        </CalendarNext>
      </CalendarHeader>
      <CalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="mt-2 w-full border-collapse select-none"
      >
        <CalendarGridHead>
          <CalendarGridRow class="flex">
            <CalendarHeadCell
              v-for="weekDay in weekDays"
              :key="weekDay"
              class="w-8 flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none"
            >
              {{ weekDay }}
            </CalendarHeadCell>
          </CalendarGridRow>
        </CalendarGridHead>
        <CalendarGridBody>
          <CalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="index"
            class="mt-2 flex w-full"
          >
            <CalendarCell
              v-for="day in weekDates"
              :key="day.toString()"
              :date="day"
              class="relative h-8 w-8 p-0 text-center text-sm"
            >
              <CalendarCellTrigger :day="day" :month="month.value" :class="cellClass" />
            </CalendarCell>
          </CalendarGridRow>
        </CalendarGridBody>
      </CalendarGrid>
    </template>
  </CalendarRoot>
</template>
