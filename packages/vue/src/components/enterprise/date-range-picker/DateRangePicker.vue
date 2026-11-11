<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

import { useUITranslation } from '../../../i18n'
import { formatDayDisplay } from '../../../lib/date'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/button'

import RangeCalendar from './RangeCalendar.vue'
import type { DateRangePreset, DateRangeValue } from './types'

const props = defineProps<{
  placeholder: string
  ariaLabel: string
  presets?: DateRangePreset[]
  disabled?: boolean
  class?: string
}>()

const value = defineModel<DateRangeValue>({ required: true })

const open = ref(false)
const { t, locale } = useUITranslation()

const fromDisplay = computed(() => formatDayDisplay(value.value.from, locale.value))
const toDisplay = computed(() => formatDayDisplay(value.value.to, locale.value))
const display = computed(() => {
  if (fromDisplay.value) {
    return toDisplay.value
      ? `${fromDisplay.value} – ${toDisplay.value}`
      : `${fromDisplay.value} – …`
  }
  return toDisplay.value ? `… – ${toDisplay.value}` : undefined
})
const hasValue = computed(() => Boolean(value.value.from || value.value.to))

const triggerClass = computed(() =>
  cn('justify-start gap-2 font-normal', !display.value && 'text-muted-foreground', props.class),
)

const contentClass = cn(
  'z-50 w-72 origin-(--reka-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none!',
  'w-auto max-w-[calc(100vw-2rem)] p-3',
)

function chooseRange(next: DateRangeValue) {
  value.value = next
  open.value = false
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :aria-label="`${ariaLabel}: ${display ?? placeholder}`"
        :disabled="disabled"
        :class="triggerClass"
      >
        <CalendarDays class="size-4 shrink-0" />
        <span class="truncate">{{ display ?? placeholder }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent align="start" :side-offset="4" :class="contentClass">
        <div class="flex flex-col gap-3 sm:flex-row">
          <div
            v-if="presets && presets.length > 0"
            class="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-36 sm:flex-col sm:overflow-visible sm:border-e sm:pe-3"
          >
            <Button
              v-for="preset in presets"
              :key="preset.label"
              type="button"
              :variant="
                preset.from === value.from && preset.to === value.to ? 'secondary' : 'ghost'
              "
              size="sm"
              class="justify-start whitespace-nowrap"
              @click="chooseRange({ from: preset.from, to: preset.to })"
            >
              {{ preset.label }}
            </Button>
          </div>
          <div class="min-w-0">
            <RangeCalendar v-model="value" :locale="locale" class="p-0" />
            <div class="mt-2 flex justify-end border-t pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="!hasValue"
                @click="chooseRange({})"
              >
                {{ t('enterprise.clear') }}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
