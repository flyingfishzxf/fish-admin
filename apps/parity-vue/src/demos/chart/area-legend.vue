<script lang="ts">
export default { name: 'ChartAreaLegend' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from '@fish-admin/vue'

const config = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  costs: { label: 'Operating costs', color: 'var(--chart-4)' },
} satisfies ChartConfig

const data = [
  { month: 'Jan', revenue: 38200, costs: 24100 },
  { month: 'Feb', revenue: 40500, costs: 25200 },
  { month: 'Mar', revenue: 39100, costs: 24800 },
  { month: 'Apr', revenue: 43800, costs: 26400 },
  { month: 'May', revenue: 46200, costs: 27100 },
  { month: 'Jun', revenue: 48290, costs: 27600 },
]

const MAX = 55000
const W = 480
const H = 240
const TOP = 8
const BOTTOM = 24
const PLOT_H = H - TOP - BOTTOM

const points = computed(() =>
  data.map((entry, index) => ({
    ...entry,
    x: 8 + (index * (W - 16)) / (data.length - 1),
    revenueY: TOP + PLOT_H - (entry.revenue / MAX) * PLOT_H,
    costsY: TOP + PLOT_H - (entry.costs / MAX) * PLOT_H,
  })),
)

const hovered = ref<number | undefined>(undefined)

const tooltipPayload = computed(() =>
  hovered.value === undefined
    ? []
    : [
        { dataKey: 'revenue', value: data[hovered.value].revenue },
        { dataKey: 'costs', value: data[hovered.value].costs },
      ],
)
const tooltipLabel = computed(() => (hovered.value === undefined ? '' : data[hovered.value].month))

function columnFromEvent(event: MouseEvent) {
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  hovered.value = Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))))
}
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <p style="margin: 0; font-size: 0.85rem; font-weight: 600">
        Revenue against operating costs
      </p>
      <p class="fish-demo-muted" style="margin: 0.15rem 0 0">
        Two series share one axis; the legend maps each colour to its key.
      </p>
    </div>
    <ChartContainer :config="config" class="relative h-60 w-full">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="Revenue and operating costs area chart"
        style="width: 100%; height: 100%"
        @mousemove="columnFromEvent"
        @mouseleave="hovered = undefined"
      >
        <defs>
          <linearGradient id="demo-chart-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="4%" stop-color="var(--color-revenue)" stop-opacity="0.35" />
            <stop offset="96%" stop-color="var(--color-revenue)" stop-opacity="0.02" />
          </linearGradient>
          <linearGradient id="demo-chart-costs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="4%" stop-color="var(--color-costs)" stop-opacity="0.3" />
            <stop offset="96%" stop-color="var(--color-costs)" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <line
          v-for="entry in [0.25, 0.5, 0.75]"
          :key="entry"
          x1="0"
          :x2="W"
          :y1="TOP + PLOT_H * entry"
          :y2="TOP + PLOT_H * entry"
          stroke="var(--border)"
          stroke-dasharray="4 4"
        />
        <polygon
          :points="`${points.map((p) => `${p.x},${p.costsY}`).join(' ')} ${W - 8},${TOP + PLOT_H} 8,${TOP + PLOT_H}`"
          fill="url(#demo-chart-costs)"
        />
        <polyline
          :points="points.map((p) => `${p.x},${p.costsY}`).join(' ')"
          fill="none"
          stroke="var(--color-costs)"
          stroke-width="2"
        />
        <polygon
          :points="`${points.map((p) => `${p.x},${p.revenueY}`).join(' ')} ${W - 8},${TOP + PLOT_H} 8,${TOP + PLOT_H}`"
          fill="url(#demo-chart-revenue)"
        />
        <polyline
          :points="points.map((p) => `${p.x},${p.revenueY}`).join(' ')"
          fill="none"
          stroke="var(--color-revenue)"
          stroke-width="2"
        />
        <line
          v-if="hovered !== undefined"
          :x1="points[hovered].x"
          :x2="points[hovered].x"
          :y1="TOP"
          :y2="TOP + PLOT_H"
          stroke="var(--border)"
        />
        <text
          v-for="entry in points"
          :key="`label-${entry.month}`"
          :x="entry.x"
          :y="H - 6"
          text-anchor="middle"
          font-size="11"
          fill="var(--muted-foreground)"
        >
          {{ entry.month }}
        </text>
      </svg>
      <div
        v-if="hovered !== undefined"
        class="pointer-events-none absolute"
        :style="{
          left: `${(points[hovered].x / W) * 100}%`,
          top: '0.25rem',
          transform: hovered > 2 ? 'translateX(-100%)' : 'translateX(-10%)',
        }"
      >
        <ChartTooltipContent active :payload="tooltipPayload" :label="tooltipLabel" indicator="line" />
      </div>
      <ChartLegendContent :payload="[{ value: 'revenue' }, { value: 'costs' }]" />
    </ChartContainer>
  </div>
</template>
