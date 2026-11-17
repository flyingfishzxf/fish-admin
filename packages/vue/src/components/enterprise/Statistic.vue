<script setup lang="ts">
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import Skeleton from '../ui/skeleton/Skeleton.vue'

const props = withDefaults(
  defineProps<{
    /** Name of the metric; also the first word of the trend's accessible label. */
    label: string
    /** Numbers go through Intl.NumberFormat; strings render verbatim. */
    value: number | string
    /** Fixed number of fraction digits passed to Intl.NumberFormat. */
    precision?: number
    /** Percentage change; its sign selects the up, down or flat icon and tone. */
    trend?: { value: number; label?: string }
    /** Lucide icon shown in the tile at the top right. */
    icon?: LucideIcon
    /** Swaps the value for two skeleton blocks and marks the card aria-busy. */
    loading?: boolean
    class?: string
  }>(),
  { loading: false },
)

const { locale } = useUITranslation()
defineSlots<{
  prefix?(): unknown
  suffix?(): unknown
}>()

const TREND_STYLES: Record<string, { icon: typeof ArrowUpRight; className: string }> = {
  up: { icon: ArrowUpRight, className: 'text-success' },
  down: { icon: ArrowDownRight, className: 'text-destructive' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
}

const formatted = computed(() =>
  typeof props.value === 'number'
    ? new Intl.NumberFormat(locale.value, {
        minimumFractionDigits: props.precision,
        maximumFractionDigits: props.precision,
      }).format(props.value)
    : props.value,
)

const direction = computed(() =>
  props.trend ? (props.trend.value > 0 ? 'up' : props.trend.value < 0 ? 'down' : 'flat') : 'flat',
)
const trendStyle = computed(() => TREND_STYLES[direction.value])
const trendText = computed(() => {
  if (!props.trend) return undefined
  const value = new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(props.trend.value)
  return `${value}%`
})
const trendLabel = computed(() =>
  props.trend
    ? [props.label, trendText.value, props.trend.label].filter(Boolean).join(' ')
    : undefined,
)
</script>

<template>
  <div
    data-slot="statistic"
    :aria-busy="props.loading || undefined"
    :class="cn('rounded-xl border bg-card p-5 text-card-foreground shadow-xs', props.class)"
  >
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm font-medium text-muted-foreground">{{ props.label }}</p>
      <span
        v-if="props.icon"
        class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <component :is="props.icon" class="size-4" />
      </span>
    </div>

    <div v-if="props.loading" class="mt-2 space-y-2">
      <Skeleton class="h-8 w-32" />
      <Skeleton class="h-3 w-24" />
    </div>
    <template v-else>
      <div class="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        <span v-if="$slots.prefix" class="text-lg font-medium text-muted-foreground">
          <slot name="prefix" />
        </span>
        <span class="text-2xl font-semibold tracking-tight tabular-nums">{{ formatted }}</span>
        <span v-if="$slots.suffix" class="text-sm text-muted-foreground">
          <slot name="suffix" />
        </span>
      </div>
      <div v-if="props.trend && trendText" class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span
          :aria-label="trendLabel"
          :class="cn('inline-flex items-center gap-0.5 font-medium', trendStyle.className)"
        >
          <component :is="trendStyle.icon" aria-hidden="true" class="size-3.5" />
          {{ trendText }}
        </span>
        <span v-if="props.trend?.label" class="text-muted-foreground">
          {{ props.trend.label }}
        </span>
      </div>
    </template>
  </div>
</template>
