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
  <div class="grid gap-2 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-center">
    <DonutChart
      :ariaLabel="t('charts.channels.title')"
      :data="props.data"
      :series="series"
      :value-format="formatValue"
      :size="200"
    />

    <ul class="space-y-2.5">
      <li
        v-for="channel in series"
        :key="channel.name"
        :data-channel="channel.name"
        class="flex items-center gap-2.5 text-sm"
      >
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: channel.color }" />
        <span class="flex-1 truncate text-muted-foreground">{{ channel.label }}</span>
        <span class="font-medium tabular-nums">{{ formatValue(valueOf(channel.name)) }}</span>
      </li>
    </ul>
  </div>
</template>
