<script lang="ts">
export default { name: 'ChartBasic' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@fish-admin/vue'

const config = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig

const data = [
  { month: 'May', revenue: 32400 },
  { month: 'Jun', revenue: 36100 },
  { month: 'Jul', revenue: 34800 },
  { month: 'Aug', revenue: 41200 },
  { month: 'Sep', revenue: 44700 },
  { month: 'Oct', revenue: 48290 },
]

const MAX = 50000
const W = 480
const H = 240
const TOP = 8
const BOTTOM = 24
const PLOT_H = H - TOP - BOTTOM

const slot = W / data.length
const barWidth = 40

const bars = computed(() =>
  data.map((entry, index) => {
    const height = (entry.revenue / MAX) * PLOT_H
    const x = slot * index + (slot - barWidth) / 2
    return { ...entry, x, y: TOP + PLOT_H - height, height, cx: slot * index + slot / 2 }
  }),
)

const hovered = ref<number | undefined>(undefined)

const tooltipPayload = computed(() =>
  hovered.value === undefined
    ? []
    : [{ dataKey: 'revenue', value: data[hovered.value].revenue }],
)
const tooltipLabel = computed(() => (hovered.value === undefined ? '' : data[hovered.value].month))

function format(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
</script>

<template>
  <div class="fish-demo-stack">
    <div>
      <p style="margin: 0; font-size: 0.85rem; font-weight: 600">Revenue by month</p>
      <p class="fish-demo-muted" style="margin: 0.15rem 0 0">
        Paid invoices in USD. Hover a bar for the exact amount.
      </p>
    </div>
    <ChartContainer :config="config" class="relative h-60 w-full">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        role="img"
        aria-label="Revenue by month bar chart"
        style="width: 100%; height: 100%"
      >
        <line
          v-for="entry in [0.25, 0.5, 0.75]"
          :key="entry"
          :x1="0"
          :x2="W"
          :y1="TOP + PLOT_H * entry"
          :y2="TOP + PLOT_H * entry"
          stroke="var(--border)"
          stroke-dasharray="4 4"
        />
        <rect
          v-for="entry in bars"
          :key="entry.month"
          :x="entry.x"
          :y="entry.y"
          :width="barWidth"
          :height="entry.height"
          rx="4"
          fill="var(--color-revenue)"
        />
        <text
          v-for="entry in bars"
          :key="`label-${entry.month}`"
          :x="entry.cx"
          :y="H - 6"
          text-anchor="middle"
          font-size="11"
          fill="var(--muted-foreground)"
        >
          {{ entry.month }}
        </text>
        <rect
          v-for="(entry, index) in bars"
          :key="`hit-${entry.month}`"
          :x="slot * index"
          :y="TOP"
          :width="slot"
          :height="PLOT_H"
          fill="transparent"
          @mouseenter="hovered = index"
          @mouseleave="hovered = undefined"
        />
      </svg>
      <div
        v-if="hovered !== undefined"
        class="pointer-events-none absolute"
        :style="{
          left: `${(slot * (hovered + 0.5) / W) * 100}%`,
          top: '0.25rem',
          transform: 'translateX(-50%)',
        }"
      >
        <ChartTooltipContent
          active
          :payload="tooltipPayload"
          :label="tooltipLabel"
        />
      </div>
    </ChartContainer>
    <p class="fish-demo-muted" style="margin: 0">
      October revenue: {{ format(48290) }}. The container maps each series to a theme colour
      through the config.
    </p>
  </div>
</template>
