<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { areaPath, monotonePath, niceTicks, type PlotArea } from './chart'
import ChartShell from './ChartShell.vue'

export interface AreaDatum {
  /** Short axis label, already formatted. */
  label: string
  value: number
  /** Longer label for the tooltip header; falls back to `label`. */
  tooltip?: string
}

const props = withDefaults(
  defineProps<{
    ariaLabel: string
    data: AreaDatum[]
    /** Any CSS colour, including the `--chart-N` variables. */
    color: string
    /** Series name shown next to the value in the tooltip. */
    seriesLabel: string
    valueFormat: (value: number) => string
    /** Axis tick formatter; defaults to the plain number. */
    yFormat?: (value: number) => string
    height?: number
    /** Dashed horizontal target line with a corner caption. */
    reference?: { value: number; label: string }
    class?: string
  }>(),
  {
    yFormat: (value: number) => String(value),
    height: 280,
    reference: undefined,
    class: undefined,
  },
)

const hover = ref(-1)
const gradientId = `chart-area-${useId()}`

const yTicks = computed(() => {
  const max = Math.max(0, props.reference?.value ?? 0, ...props.data.map((point) => point.value))
  return niceTicks(max, 4)
})

function points(xs: number[], yFor: (value: number) => number) {
  return props.data.map((point, index) => ({ x: xs[index] ?? 0, y: yFor(point.value) }))
}

function tooltipStyle(plot: PlotArea, xs: number[], width: number) {
  const anchor = xs[hover.value] ?? plot.x
  return {
    left: `${Math.min(Math.max(anchor + 12, 4), Math.max(4, width - 172))}px`,
    top: `${plot.y}px`,
  }
}
</script>

<template>
  <ChartShell
    :ariaLabel="props.ariaLabel"
    :height="props.height"
    :y-ticks="yTicks"
    :x-labels="props.data.map((point) => point.label)"
    :y-format="props.yFormat"
    :class="props.class"
    @hover="hover = $event"
  >
    <template #plot="{ plot, xPositions, yFor }">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="4%" :stop-color="props.color" stop-opacity="0.35" />
          <stop offset="96%" :stop-color="props.color" stop-opacity="0.02" />
        </linearGradient>
      </defs>

      <g data-chart-reveal class="chart-reveal-x">
        <path
          v-if="props.data.length"
          data-chart-area
          :d="areaPath(points(xPositions, yFor), plot.bottom)"
          :fill="`url(#${gradientId})`"
        />
        <path
          v-if="props.data.length"
          data-chart-line
          :d="monotonePath(points(xPositions, yFor))"
          fill="none"
          :stroke="props.color"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>

      <line
        v-if="props.reference"
        data-chart-reference
        :x1="plot.x"
        :x2="plot.right"
        :y1="yFor(props.reference.value)"
        :y2="yFor(props.reference.value)"
        :stroke="props.color"
        stroke-opacity="0.7"
        stroke-dasharray="6 4"
      />
      <text
        v-if="props.reference"
        :x="plot.right"
        :y="yFor(props.reference.value) - 6"
        text-anchor="end"
        fill="var(--muted-foreground)"
        font-size="11"
      >
        {{ props.reference.label }}
      </text>

      <g v-if="hover >= 0 && props.data[hover]">
        <line
          data-chart-cursor
          :x1="xPositions[hover]"
          :x2="xPositions[hover]"
          :y1="plot.y"
          :y2="plot.bottom"
          stroke="var(--border)"
        />
        <circle
          data-chart-active-dot
          :cx="xPositions[hover]"
          :cy="yFor(props.data[hover]!.value)"
          r="4"
          :fill="props.color"
          stroke="var(--background)"
          stroke-width="2"
        />
      </g>
    </template>

    <template #overlay="{ plot, xPositions, width }">
      <div
        v-if="hover >= 0 && props.data[hover]"
        data-chart-tooltip
        class="pointer-events-none absolute z-10 grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 text-xs shadow-lg"
        :style="tooltipStyle(plot, xPositions, width)"
      >
        <span class="font-medium">{{
          props.data[hover]!.tooltip ?? props.data[hover]!.label
        }}</span>
        <span class="flex items-center gap-2">
          <span
            class="h-2.5 w-1 shrink-0 rounded-[2px]"
            :style="{ backgroundColor: props.color }"
          />
          <span class="flex-1 text-muted-foreground">{{ props.seriesLabel }}</span>
          <span class="font-mono font-medium tabular-nums">{{
            props.valueFormat(props.data[hover]!.value)
          }}</span>
        </span>
      </div>
    </template>
  </ChartShell>
</template>
