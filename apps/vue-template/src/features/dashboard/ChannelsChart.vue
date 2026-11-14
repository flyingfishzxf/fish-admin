<script setup lang="ts">
import type { ChannelPoint } from '@fish-admin/contracts'
import { computed } from 'vue'

import DonutChart from '../../components/ui/chart/DonutChart.vue'
import { formatPercent } from '../../lib/format'
import { language, useT } from '../../lib/i18n'

const props = defineProps<{ data: ChannelPoint[] }>()

const t = useT('dashboard')

const COLORS: Record<string, string> = {
  direct: 'var(--chart-1)',
  organic: 'var(--chart-2)',
  referral: 'var(--chart-3)',
  social: 'var(--chart-4)',
  email: 'var(--chart-5)',
}

const series = computed(() =>
  props.data.map((channel) => ({
    name: channel.name,
    label: t(`channels.${channel.name}`),
    color: COLORS[channel.name] ?? 'var(--chart-1)',
  })),
)

function formatValue(value: number) {
  return formatPercent(value, language.value)
}

function valueOf(name: string) {
  return props.data.find((channel) => channel.name === name)?.value ?? 0
}
</script>

<template>
  <!-- The card is a third of the grid, so the ring stays at 160 px: at the React
       template's 200 the legend column had ~20 px left and every channel name
       truncated. Labels wrap rather than ellipsise — a second line costs 18 px,
       an ellipsis costs the reader the channel name. -->
  <div class="grid gap-3 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)] sm:items-center">
    <DonutChart
      :ariaLabel="t('charts.channels.title')"
      :data="props.data"
      :series="series"
      :value-format="formatValue"
      :size="160"
    />

    <ul class="space-y-2.5">
      <li
        v-for="channel in series"
        :key="channel.name"
        :data-channel="channel.name"
        class="flex items-center gap-2.5 text-sm"
      >
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: channel.color }" />
        <span class="min-w-0 flex-1 text-muted-foreground">{{ channel.label }}</span>
        <span class="shrink-0 font-medium tabular-nums">{{
          formatValue(valueOf(channel.name))
        }}</span>
      </li>
    </ul>
  </div>
</template>
