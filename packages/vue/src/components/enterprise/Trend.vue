<script setup lang="ts">
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'

const props = withDefaults(
  defineProps<{
    /** Signed delta to format; its sign decides the arrow and direction. */
    value: number
    /** Context announced and shown after the value, e.g. "vs last month". */
    label?: string
    /** Text appended directly after the formatted number. */
    suffix?: string
    /** Maximum fraction digits passed to `Intl.NumberFormat`. */
    precision?: number
    /** Flips the success/destructive tone for metrics where lower is better. */
    invert?: boolean
    class?: string
  }>(),
  { suffix: '%', precision: 1 },
)

const { locale } = useUITranslation()

const direction = computed(() => (props.value > 0 ? 'up' : props.value < 0 ? 'down' : 'flat'))
const tone = computed(() => {
  const d = direction.value
  return d === 'flat' || !props.invert ? d : d === 'up' ? 'down' : 'up'
})
const TONE_CLASSES: Record<string, string> = {
  up: 'text-success',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
}
const formatted = computed(() =>
  new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: props.precision,
    signDisplay: 'exceptZero',
  }).format(props.value),
)
const accessibleLabel = computed(() =>
  [`${formatted.value}${props.suffix}`, props.label].filter(Boolean).join(' '),
)
</script>

<template>
  <span
    role="img"
    :aria-label="accessibleLabel"
    data-slot="trend"
    :class="
      cn('inline-flex items-center gap-1 text-xs font-medium', TONE_CLASSES[tone], props.class)
    "
  >
    <ArrowUpRight v-if="direction === 'up'" aria-hidden="true" class="size-3.5" />
    <ArrowDownRight v-else-if="direction === 'down'" aria-hidden="true" class="size-3.5" />
    <Minus v-else aria-hidden="true" class="size-3.5" />
    <span aria-hidden="true">{{ formatted }}{{ props.suffix }}</span>
    <span v-if="props.label" aria-hidden="true" class="font-normal text-muted-foreground">
      {{ props.label }}
    </span>
  </span>
</template>
