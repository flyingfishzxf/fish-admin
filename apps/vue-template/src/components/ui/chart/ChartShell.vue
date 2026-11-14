<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { computed, ref, useTemplateRef } from 'vue'

import { bandIndexAt, bandX, evenX, nearestIndexAt, type PlotArea } from './chart'
import { useChartSize } from './use-chart-size'

/**
 * Axis and grid layer shared by the cartesian charts.
 *
 * The SVG is drawn at the measured pixel width rather than scaled from a fixed
 * viewBox, so tick labels keep their size at every container width. The plot
 * slot receives the rectangle the series should draw into; the overlay slot
 * renders above the svg for things HTML does better, like the tooltip.
 */
const props = withDefaults(
  defineProps<{
    ariaLabel: string
    /** Total height including the axis band. */
    height: number
    /** Tick values from zero upward; the last one is the axis maximum. */
    yTicks: number[]
    /** One label per datum, placed by `xMode`. */
    xLabels: string[]
    xMode?: 'even' | 'band'
    hitMode?: 'nearest' | 'band'
    yFormat?: (value: number) => string
    margin?: Partial<{ top: number; right: number; bottom: number; left: number }>
    class?: string
  }>(),
  {
    xMode: 'even',
    hitMode: 'nearest',
    yFormat: (value: number) => String(value),
    margin: () => ({}),
    class: undefined,
  },
)

const emit = defineEmits<{ hover: [index: number] }>()

const BASE_MARGIN = { top: 8, right: 8, bottom: 26, left: 44 }
const MIN_LABEL_GAP = 54

const container = useTemplateRef<HTMLElement>('container')
const width = useChartSize(container)
const hoverIndex = ref(-1)

const plot = computed<PlotArea>(() => {
  const margin = { ...BASE_MARGIN, ...props.margin }
  const right = Math.max(0, width.value - margin.right)
  const bottom = Math.max(0, props.height - margin.bottom)
  return {
    x: margin.left,
    y: margin.top,
    width: Math.max(0, right - margin.left),
    height: Math.max(0, bottom - margin.top),
    right,
    bottom,
  }
})

const yMax = computed(() => props.yTicks[props.yTicks.length - 1] ?? 1)

const xPositions = computed(() => {
  const count = props.xLabels.length
  return props.xMode === 'band' ? bandX(plot.value, count) : evenX(plot.value, count)
})

/** Labels thin out instead of overlapping once the bands get narrow. */
const visibleLabels = computed(() =>
  props.xLabels
    .map((label, index) => ({ label, x: xPositions.value[index] ?? 0 }))
    .filter((_, index, all) => {
      const capacity = Math.max(2, Math.floor(plot.value.width / MIN_LABEL_GAP))
      if (all.length <= capacity) return true
      return index % Math.ceil(all.length / capacity) === 0
    }),
)

function yFor(value: number) {
  const area = plot.value
  if (yMax.value <= 0) return area.bottom
  return area.bottom - (value / yMax.value) * area.height
}

function onMove(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const area = plot.value
  const next =
    props.hitMode === 'band'
      ? bandIndexAt(x, area, props.xLabels.length)
      : nearestIndexAt(x, area, props.xLabels.length)

  if (next === hoverIndex.value) return
  hoverIndex.value = next
  emit('hover', next)
}

function onLeave() {
  if (hoverIndex.value === -1) return
  hoverIndex.value = -1
  emit('hover', -1)
}
</script>

<template>
  <div
    ref="container"
    data-slot="chart"
    :class="cn('relative w-full', props.class)"
    :style="{ height: `${props.height}px` }"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
    <svg
      :width="width"
      :height="props.height"
      :viewBox="`0 0 ${width} ${props.height}`"
      role="img"
      :aria-label="props.ariaLabel"
      style="overflow: visible"
    >
      <g data-chart-grid>
        <line
          v-for="tick in props.yTicks"
          :key="`grid-${tick}`"
          :x1="plot.x"
          :x2="plot.right"
          :y1="yFor(tick)"
          :y2="yFor(tick)"
          stroke="var(--border)"
          stroke-opacity="0.6"
          stroke-dasharray="4 4"
        />
      </g>

      <g data-chart-y-axis>
        <text
          v-for="tick in props.yTicks"
          :key="`y-${tick}`"
          :x="plot.x - 8"
          :y="yFor(tick) + 4"
          text-anchor="end"
          fill="var(--muted-foreground)"
          font-size="11"
        >
          {{ props.yFormat(tick) }}
        </text>
      </g>

      <g data-chart-x-axis>
        <text
          v-for="label in visibleLabels"
          :key="`x-${label.x}`"
          :x="label.x"
          :y="plot.bottom + 17"
          text-anchor="middle"
          fill="var(--muted-foreground)"
          font-size="11"
        >
          {{ label.label }}
        </text>
      </g>

      <slot name="plot" :plot="plot" :x-positions="xPositions" :y-for="yFor" :y-max="yMax" />
    </svg>

    <slot
      name="overlay"
      :plot="plot"
      :x-positions="xPositions"
      :y-for="yFor"
      :y-max="yMax"
      :width="width"
    />
  </div>
</template>
