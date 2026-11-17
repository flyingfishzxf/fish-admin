<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'
import Popover from './Popover.vue'
import Select from '../ui/select/Select.vue'
import SelectContent from '../ui/select/SelectContent.vue'
import SelectItem from '../ui/select/SelectItem.vue'
import SelectTrigger from '../ui/select/SelectTrigger.vue'
import SelectValue from '../ui/select/SelectValue.vue'

const props = withDefaults(
  defineProps<{
    /** Selected time as an `HH:mm` 24-hour string; invalid or empty values show the placeholder. */
    value?: string
    /** Trigger text shown while no time is selected. */
    placeholder: string
    /** Accessible name; the display value and the HH/MM select labels are appended to it. */
    ariaLabel: string
    /** Interval between minute options, clamped to 1–59. */
    minuteStep?: number
    /** Disables the trigger. */
    disabled?: boolean
    class?: string
  }>(),
  { minuteStep: 5 },
)

const emit = defineEmits<{ change: [value: string | undefined] }>()

import { HOUR_OPTIONS, minuteOptionsFor } from '../../lib/time-options'

const { t } = useUITranslation()
const open = ref(false)

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const HOURS = HOUR_OPTIONS

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

interface Parsed {
  hour: number
  minute: number
}

const time = computed<Parsed | undefined>(() => {
  if (!props.value) return undefined
  const match = TIME_PATTERN.exec(props.value)
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : undefined
})

const display = computed(() =>
  time.value ? `${pad(time.value.hour)}:${pad(time.value.minute)}` : undefined,
)

const minuteOptions = computed(() => minuteOptionsFor(props.minuteStep, time.value?.minute))

function update(hour: number, minute: number) {
  emit('change', `${pad(hour)}:${pad(minute)}`)
}
</script>

<template>
  <Popover :open="open" align="start" class="w-auto min-w-64 p-3" @update:open="open = $event">
    <template #trigger>
      <Button
        type="button"
        variant="outline"
        :aria-label="`${props.ariaLabel}: ${display ?? props.placeholder}`"
        :disabled="props.disabled"
        :class="
          cn('justify-start gap-2 font-normal', !display && 'text-muted-foreground', props.class)
        "
      >
        <Clock class="size-4 shrink-0" />
        <span class="truncate">{{ display ?? props.placeholder }}</span>
      </Button>
    </template>
    <div class="flex items-end gap-2">
      <div class="flex flex-col gap-1">
        <span
          aria-hidden="true"
          class="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
        >
          HH
        </span>
        <Select
          :model-value="time ? pad(time.hour) : ''"
          @update:model-value="(next) => update(Number(next), time?.minute ?? 0)"
        >
          <SelectTrigger :aria-label="`${props.ariaLabel} hours`" class="w-20">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem v-for="hour in HOURS" :key="hour" :value="pad(hour)">
              {{ pad(hour) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span aria-hidden="true" class="pb-2 text-muted-foreground">:</span>
      <div class="flex flex-col gap-1">
        <span
          aria-hidden="true"
          class="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
        >
          MM
        </span>
        <Select
          :model-value="time ? pad(time.minute) : ''"
          @update:model-value="(next) => update(time?.hour ?? 0, Number(next))"
        >
          <SelectTrigger :aria-label="`${props.ariaLabel} minutes`" class="w-20">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem v-for="minute in minuteOptions" :key="minute" :value="pad(minute)">
              {{ pad(minute) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div class="mt-3 flex justify-end gap-2 border-t pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :disabled="!time"
        @click="
          () => {
            emit('change', undefined)
            open = false
          }
        "
      >
        {{ t('enterprise.clear') }}
      </Button>
      <Button type="button" variant="outline" size="sm" @click="open = false">
        {{ t('actions.close') }}
      </Button>
    </div>
  </Popover>
</template>
