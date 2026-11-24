<script setup lang="ts">
import { computed, ref } from 'vue'

import { groupedBars, niceTicks, type PlotArea } from './chart'
import ChartShell from './ChartShell.vue'

export interface BarDatum {
  label: string
  /** One value per entry in `series`, in the same order. */
  values: number[]
  tooltip?: string
}

export interface BarSeries {
  label: string
  color: string
}

const props = withDefaults(
  defineProps<{
    ariaLabel: string
    data: BarDatum[]
    series: BarSeries[]
    valueFormat: (value: number) => string
    /** Axis tick formatter; defaults to the plain number. */
    yFormat?: (value: number) => string
    height?: number
    class?: string
  }>(),
  {
    yFormat: (value: number) => String(value),
    height: 280,
    class: undefined,
  },
)

const hover = ref(-1)

const yTicks = computed(() => {
  const max = Math.max(
    0,
    ...props.data.flatMap((point) => point.values.map((value) => Math.max(0, value))),
  )
  return niceTicks(max, 4)
})

function bars(plot: PlotArea, yMax: number) {
  return groupedBars({
    plot,
    values: props.data.map((point) => point.values),
    seriesCount: props.series.length,
    max: yMax,
  })
}

function tooltipStyle(plot: PlotArea, xs: number[], width: number) {
  const anchor = xs[hover.value] ?? plot.x
  return {
    left: `${Math.min(Math.max(anchor - 80, 4), Math.max(4, width - 176))}px`,
    top: `${plot.y}px`,
  }
}
</script>

<template>
  <div data-slot="bar-chart" :class="props.class">
    <ChartShell
      :ariaLabel="props.ariaLabel"
      :height="props.height"
      :y-ticks="yTicks"
      :x-labels="props.data.map((point) => point.label)"
      :y-format="props.yFormat"
      x-mode="band"
      hit-mode="band"
      @hover="hover = $event"
    >
      <template #plot="{ plot, yMax }">
        <g data-chart-bars class="chart-reveal-y">
          <template v-for="(group, index) in bars(plot, yMax)" :key="`group-${index}`">
            <rect
              v-for="(bar, series) in group"
              :key="`bar-${index}-${series}`"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :rx="3"
              :fill="props.series[series]?.color"
            />
          </template>
        </g>

        <rect
          v-if="hover >= 0 && plot.width > 0"
          data-chart-band-cursor
          :x="plot.x + (plot.width / Math.max(1, props.data.length)) * hover"
          :y="plot.y"
          :width="plot.width / Math.max(1, props.data.length)"
          :height="plot.height"
          fill="var(--muted)"
          fill-opacity="0.4"
        />
      </template>

      <template #overlay="{ plot, xPositions, width }">
        <div
          v-if="hover >= 0 && props.data[hover]"
          data-chart-tooltip
          class="pointer-events-none absolute z-10 grid min-w-[9rem] gap-1.5 rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 text-xs shadow-lg"
          :style="tooltipStyle(plot, xPositions, width)"
        >
          <span class="font-medium">{{
            props.data[hover]!.tooltip ?? props.data[hover]!.label
          }}</span>
          <span
            v-for="(item, series) in props.series"
            :key="`tip-${series}`"
            class="flex items-center gap-2"
          >
            <span
              class="h-2.5 w-1 shrink-0 rounded-[2px]"
              :style="{ backgroundColor: item.color }"
            />
            <span class="flex-1 text-muted-foreground">{{ item.label }}</span>
            <span class="font-mono font-medium tabular-nums">{{
              props.valueFormat(props.data[hover]!.values[series] ?? 0)
            }}</span>
          </span>
        </div>
      </template>
    </ChartShell>

    <ul
      data-chart-legend
      class="flex items-center justify-center gap-4 pt-1 text-xs text-muted-foreground"
    >
      <li v-for="item in props.series" :key="item.label" class="flex items-center gap-1.5">
        <span class="size-2 shrink-0 rounded-[2px]" :style="{ backgroundColor: item.color }" />
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>
