<script setup lang="ts">
import { computed } from 'vue'

import { cn } from '../../../lib/utils'
import { useChart } from './context'

export interface ChartPayloadItem {
  name?: string
  dataKey?: string
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

const props = withDefaults(
  defineProps<{
    active?: boolean
    payload?: ChartPayloadItem[]
    label?: string | number
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
    class?: string
  }>(),
  { active: false, indicator: 'dot' },
)

const { config } = useChart()

const items = computed(
  () =>
    props.payload?.map((entry) => {
      const key = entry.dataKey ?? entry.name ?? ''
      const series = config[key]
      return {
        key,
        label: series?.label ?? entry.name ?? key,
        value: entry.value,
        color: series?.color ?? series?.theme?.light ?? entry.color,
      }
    }) ?? [],
)

const header = computed(() => {
  if (props.hideLabel || props.label === undefined) return undefined
  const key = String(props.label)
  return config[props.labelKey ?? key]?.label ?? key
})
</script>

<template>
  <div
    v-if="props.active && items.length > 0"
    data-slot="chart-tooltip-content"
    :class="
      cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
        props.class,
      )
    "
  >
    <p v-if="header" class="font-medium">{{ header }}</p>
    <div v-for="item in items" :key="item.key" class="flex w-full flex-wrap items-center gap-1.5">
      <span
        v-if="!props.hideIndicator"
        aria-hidden="true"
        class="inline-block h-2 w-2 shrink-0 rounded-[2px]"
        :class="
          props.indicator === 'line'
            ? 'h-[2px] w-4'
            : props.indicator === 'dashed'
              ? 'h-[2px] w-4 border-dashed'
              : ''
        "
        :style="{ background: item.color }"
      />
      <span class="text-muted-foreground">{{ item.label }}</span>
      <span class="ml-auto font-mono font-medium text-foreground tabular-nums">
        {{ item.value }}
      </span>
    </div>
  </div>
</template>
