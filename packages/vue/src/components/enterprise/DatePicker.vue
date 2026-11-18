<script setup lang="ts">
import { CalendarDays } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { formatDayDisplay } from '../../lib/date'
import { Button } from '../ui/button'
import Popover from './Popover.vue'
import Calendar from '../ui/Calendar.vue'

const props = withDefaults(
  defineProps<{
    /** Selected day as a `YYYY-MM-DD` string. */
    value?: string
    /** Trigger text shown while no date is selected. */
    placeholder: string
    /** Accessible name; the current display value is appended to it. */
    ariaLabel: string
    /** Earliest selectable day as `YYYY-MM-DD`; earlier days are disabled. */
    min?: string
    /** Latest selectable day as `YYYY-MM-DD`; later days are disabled. */
    max?: string
    /** Disables the trigger. */
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ change: [value: string | undefined] }>()

const { t, locale } = useUITranslation()
const open = ref(false)

const display = computed(() => formatDayDisplay(props.value, locale.value))

function onPick(next: string | undefined) {
  emit('change', next)
  if (next) open.value = false
}
</script>

<template>
  <Popover
    :open="open"
    align="start"
    class="w-auto max-w-[calc(100vw-2rem)] p-3"
    @update:open="open = $event"
  >
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
        <CalendarDays class="size-4 shrink-0" />
        <span class="truncate">{{ display ?? props.placeholder }}</span>
      </Button>
    </template>
    <Calendar
      :model-value="props.value"
      :locale="locale"
      :min="props.min"
      :max="props.max"
      class="p-0"
      @update:model-value="onPick"
    />
    <div class="mt-2 flex justify-end border-t pt-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :disabled="!props.value"
        @click="
          () => {
            emit('change', undefined)
            open = false
          }
        "
      >
        {{ t('enterprise.clear') }}
      </Button>
    </div>
  </Popover>
</template>
