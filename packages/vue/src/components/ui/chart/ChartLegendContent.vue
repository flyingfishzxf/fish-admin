<script setup lang="ts">
import { cn } from '../../../lib/utils'
import { useChart } from './context'

export interface ChartLegendItem {
  value?: string
  color?: string
}

const props = defineProps<{
  payload?: ChartLegendItem[]
  hideIcon?: boolean
  nameKey?: string
  class?: string
}>()

const { config } = useChart()
</script>

<template>
  <div
    data-slot="chart-legend-content"
    :class="cn('flex flex-wrap items-center justify-center gap-4', props.class)"
  >
    <div
      v-for="entry in props.payload ?? []"
      :key="entry.value"
      class="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <span
        v-if="!props.hideIcon"
        aria-hidden="true"
        class="inline-block h-2 w-2 shrink-0 rounded-[2px]"
        :style="{
          background:
            config[entry.value ?? '']?.color ??
            config[entry.value ?? '']?.theme?.light ??
            entry.color,
        }"
      />
      {{ config[entry.value ?? '']?.label ?? entry.value }}
    </div>
  </div>
</template>
