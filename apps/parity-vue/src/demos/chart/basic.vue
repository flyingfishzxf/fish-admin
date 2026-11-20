<script lang="ts">
export default { name: 'ChartBasic' }
</script>

<script setup lang="ts">
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  renderChartTooltip,
  VisAxis,
  VisGroupedBar,
  VisXYContainer,
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

const x = (_d: (typeof data)[number], i: number) => i
const y = (d: (typeof data)[number]) => [d.revenue]
const color = () => 'var(--color-revenue)'
const xTickFormat = (i: number) => data[Math.round(i)]?.month ?? ''
const yTickFormat = (v: number) => `$${v / 1000}k`

function tooltipTemplate(d: (typeof data)[number]) {
  return renderChartTooltip({
    config,
    label: d.month,
    payload: [{ dataKey: 'revenue', value: d.revenue }],
  })
}
</script>

<template>
  <div class="fish-demo-stack">
    <ChartContainer :config="config" class="relative h-60 w-full">
      <VisXYContainer
        :data="data"
        :x-domain="[0, data.length - 1]"
        :y-domain="[0, 50000]"
        style="width: 100%; height: 100%"
      >
        <ChartCrosshair :template="tooltipTemplate" />
        <ChartTooltip />
        <VisGroupedBar :x="x" :y="y" :color="color" :rounded-corners="4" :bar-padding="0.4" />
        <VisAxis type="x" :tick-format="xTickFormat" :grid-line="false" :tick-line="false" />
        <VisAxis type="y" :tick-format="yTickFormat" :domain-line="false" :grid-line="false" />
      </VisXYContainer>
    </ChartContainer>
  </div>
</template>
