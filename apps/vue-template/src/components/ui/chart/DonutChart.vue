<script setup lang="ts">
import { computed, ref } from 'vue'

import { arcPath } from './chart'

export interface DonutDatum {
  name: string
  value: number
}

export interface DonutSeries {
  name: string
  label: string
  color: string
}

const props = withDefaults(
  defineProps<{
    ariaLabel: string
    data: DonutDatum[]
    /** Colour and label lookup, keyed by `data[].name`. */
    series: DonutSeries[]
    /** Outer diameter in pixels. */
    size?: number
    valueFormat: (value: number) => string
    tooltipMode?: 'value' | 'share'
  }>(),
  { size: 200, tooltipMode: 'value' },
)

/** Degrees of clear space between neighbouring segments, as Recharts counts it. */
const PADDING_ANGLE = 3

const hover = ref(-1)

const total = computed(() => props.data.reduce((sum, item) => sum + Math.max(0, item.value), 0))

const segments = computed(() => {
  const count = props.data.length
  if (count === 0) return []

  const padding = ((PADDING_ANGLE * Math.PI) / 180) * (count > 1 ? 1 : 0)
  const sweep = Math.PI * 2 - padding * count
  let cursor = -Math.PI / 2

  return props.data.map((item) => {
    const share = total.value > 0 ? Math.max(0, item.value) / total.value : 0
    const start = cursor
    const end = start + share * sweep
    cursor = end + padding
    return { name: item.name, start, end, share }
  })
})

const radius = computed(() => props.size / 2)
const innerRadius = computed(() => radius.value * 0.62)
const outerRadius = computed(() => radius.value * 0.92)

function seriesFor(name: string) {
  return props.series.find((item) => item.name === name)
}

function tooltipText(segment: { name: string; share: number }) {
  const datum = props.data.find((item) => item.name === segment.name)
  if (!datum) return ''
  return props.tooltipMode === 'share'
    ? `${Math.round(segment.share * 1000) / 10}%`
    : props.valueFormat(datum.value)
}
</script>

<template>
  <div
    data-slot="donut-chart"
    class="relative mx-auto"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
  >
    <svg
      :width="props.size"
      :height="props.size"
      :viewBox="`0 0 ${props.size} ${props.size}`"
      role="img"
      :aria-label="props.ariaLabel"
    >
      <circle
        v-if="total <= 0"
        data-chart-empty-ring
        :cx="radius"
        :cy="radius"
        :r="(innerRadius + outerRadius) / 2"
        fill="none"
        stroke="var(--muted)"
        :stroke-width="outerRadius - innerRadius"
      />
      <path
        v-for="(segment, index) in segments"
        :key="segment.name"
        :data-donut-segment="segment.name"
        class="chart-reveal-pop"
        :d="arcPath(radius, radius, innerRadius, outerRadius, segment.start, segment.end)"
        :fill="seriesFor(segment.name)?.color"
        :fill-opacity="hover === -1 || hover === index ? 1 : 0.55"
        :style="{ transition: 'fill-opacity 120ms', animationDelay: `${index * 60}ms` }"
        @mouseenter="hover = index"
        @mouseleave="hover = -1"
      />
    </svg>

    <div
      v-if="hover >= 0 && segments[hover]"
      data-chart-tooltip
      class="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <span
        class="grid gap-0.5 rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 text-center text-xs shadow-lg"
      >
        <span class="text-muted-foreground">{{ seriesFor(segments[hover]!.name)?.label }}</span>
        <span class="font-mono font-medium tabular-nums">{{ tooltipText(segments[hover]!) }}</span>
      </span>
    </div>
  </div>
</template>
