<script setup lang="ts">
import type { RevenuePoint } from '@fish-admin/contracts'
import { computed } from 'vue'

import AreaChart from '../../components/ui/chart/AreaChart.vue'
import { formatCompactNumber, formatCurrency, formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'

const props = defineProps<{ data: RevenuePoint[] }>()

const t = useT('dashboard')

const points = computed(() =>
  props.data.map((point) => ({
    label: formatDate(point.date, language.value),
    value: point.value,
    tooltip: formatDate(point.date, language.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  })),
)

function formatValue(value: number) {
  return formatCurrency(value, language.value)
}

function formatAxis(value: number) {
  return formatCompactNumber(value, language.value)
}
</script>

<template>
  <AreaChart
    :ariaLabel="t('charts.revenue.title')"
    :data="points"
    color="var(--chart-1)"
    :series-label="t('series.revenue')"
    :value-format="formatValue"
    :y-format="formatAxis"
  />
</template>
