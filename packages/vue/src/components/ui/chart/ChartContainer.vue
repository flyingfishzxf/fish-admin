<script setup lang="ts">
import { computed, provide, useId } from 'vue'

import { cn } from '../../../lib/utils'
import { CHART_KEY, type ChartConfig } from './context'
import ChartStyle from './ChartStyle.vue'

const props = withDefaults(
  defineProps<{
    config: ChartConfig
    class?: string
  }>(),
  {},
)

const chartId = `chart-${useId().replace(/:/g, '')}`
provide(CHART_KEY, { config: computed(() => props.config) })

const BASE =
  'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none'
</script>

<template>
  <div data-slot="chart" :data-chart="chartId" :class="cn(BASE, props.class)">
    <ChartStyle :id="chartId" :config="props.config" />
    <slot />
  </div>
</template>
