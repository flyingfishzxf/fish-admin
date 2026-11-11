<script setup lang="ts">
import { parseDate } from '@internationalized/date'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarHeading,
  RangeCalendarNext,
  RangeCalendarPrev,
  RangeCalendarRoot,
  type DateRange,
} from 'reka-ui'
import { computed } from 'vue'

import { useUITranslation } from '../../../i18n'
import { cn } from '../../../lib/utils'

import type { DateRangeValue } from './types'

const props = defineProps<{ modelValue: DateRangeValue; locale: string; class?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: DateRangeValue] }>()

const { t } = useUITranslation()

const range = computed<DateRange | null>(() => {
  const start = props.modelValue.from ? parseDate(props.modelValue.from) : undefined
  const end = props.modelValue.to ? parseDate(props.modelValue.to) : undefined
  return start || end ? { start, end } : null
})

function onUpdate(next: DateRange | null) {
  emit('update:modelValue', {
    from: next?.start?.toString(),
    to: next?.end?.toString(),
  })
}

const navClass =
  'inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'

const cellClass = cn(
  'size-8 rounded-md p-0 text-center text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selection-start]:rounded-s-md data-[selection-end]:rounded-e-md data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 data-[today]:bg-accent data-[today]:text-accent-foreground',
)
</script>

<template>
  <RangeCalendarRoot
    :model-value="range"
    :locale="locale"
    :calendar-label="t('calendar.label')"
    initial-focus
    :class="cn('w-fit bg-background p-3', props.class)"
    @update:model-value="onUpdate"
  >
    <template #default="{ weekDays, grid }">
      <RangeCalendarHeader class="relative flex w-full items-center justify-between gap-1">
        <RangeCalendarPrev :aria-label="t('calendar.previousMonth')" :class="navClass">
          <ChevronLeftIcon class="size-4" />
        </RangeCalendarPrev>
        <RangeCalendarHeading class="text-sm font-medium select-none" />
        <RangeCalendarNext :aria-label="t('calendar.nextMonth')" :class="navClass">
          <ChevronRightIcon class="size-4" />
        </RangeCalendarNext>
      </RangeCalendarHeader>
      <RangeCalendarGrid
        v-for="month in grid"
        :key="month.value.toString()"
        class="mt-2 w-full border-collapse select-none"
      >
        <RangeCalendarGridHead>
          <RangeCalendarGridRow class="flex">
            <RangeCalendarHeadCell
              v-for="weekDay in weekDays"
              :key="weekDay"
              class="w-8 flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none"
            >
              {{ weekDay }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="index"
            class="mt-2 flex w-full"
          >
            <RangeCalendarCell
              v-for="day in weekDates"
              :key="day.toString()"
              :date="day"
              class="relative h-8 w-8 p-0 text-center text-sm"
            >
              <RangeCalendarCellTrigger :day="day" :month="month.value" :class="cellClass" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </template>
  </RangeCalendarRoot>
</template>
