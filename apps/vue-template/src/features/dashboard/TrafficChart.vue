<script setup lang="ts">
import type { TrafficPoint } from '@fish-admin/contracts'
import { computed } from 'vue'

import BarChart from '../../components/ui/chart/BarChart.vue'
import { formatCompactNumber, formatDate, formatNumber } from '../../lib/format'
import { language, useT } from '../../lib/i18n'

const props = defineProps<{ data: TrafficPoint[] }>()

const t = useT('dashboard')

const points = computed(() =>
  props.data.map((point) => ({
    label: formatDate(point.date, language.value),
    values: [point.visits, point.signups],
    tooltip: formatDate(point.date, language.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  })),
)

const series = computed(() => [
  { label: t('series.visits'), color: 'var(--chart-2)' },
  { label: t('series.signups'), color: 'var(--chart-3)' },
])

function formatValue(value: number) {
  return formatNumber(value, language.value)
}

function formatAxis(value: number) {
  return formatCompactNumber(value, language.value)
}
</script>

<template>
  <BarChart
    :ariaLabel="t('charts.traffic.title')"
    :data="points"
    :series="series"
    :value-format="formatValue"
    :y-format="formatAxis"
  />
</template>
