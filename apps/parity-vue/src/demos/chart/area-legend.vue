<script lang="ts">
export default { name: 'ChartAreaLegend' }
</script>

<script setup lang="ts">
import {
  ChartContainer,
  ChartCrosshair,
  ChartLegendContent,
  ChartTooltip,
  renderChartTooltip,
  VisArea,
  VisAxis,
  VisXYContainer,
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

// unovis uses a point model; each series is one VisArea over the shared scale.
const x = (_d: (typeof data)[number], i: number) => i
const revenueY = (d: (typeof data)[number]) => d.revenue
const costsY = (d: (typeof data)[number]) => d.costs
const revenueColor = () => 'var(--color-revenue)'
const costsColor = () => 'var(--color-costs)'
const xTickFormat = (i: number) => data[Math.round(i)]?.month ?? ''
const yTickFormat = (v: number) => `$${v / 1000}k`

function tooltipTemplate(d: (typeof data)[number]) {
  return renderChartTooltip({
    config,
    label: d.month,
    payload: [
      { dataKey: 'revenue', value: d.revenue },
      { dataKey: 'costs', value: d.costs },
    ],
  })
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
      <VisXYContainer
        :data="data"
        :x-domain="[0, data.length - 1]"
        :y-domain="[0, 55000]"
        style="width: 100%; height: 100%"
      >
        <ChartCrosshair :template="tooltipTemplate" />
        <ChartTooltip />
        <VisArea :x="x" :y="costsY" :data="data" :color="costsColor" :opacity="0.3" :line="true" />
        <VisArea :x="x" :y="revenueY" :data="data" :color="revenueColor" :opacity="0.3" :line="true" />
        <VisAxis type="x" :tick-format="xTickFormat" :grid-line="false" :tick-line="false" />
        <VisAxis type="y" :tick-format="yTickFormat" :domain-line="false" :grid-line="false" />
      </VisXYContainer>
      <ChartLegendContent :payload="Object.keys(config).map((key) => ({ value: key }))" />
    </ChartContainer>
  </div>
</template>
