<script setup lang="ts">
import type { DashboardKpi } from '@fish-admin/contracts'
import { cn } from '@fish-admin/vue'
import { Target, TrendingDown, TrendingUp, UserPlus, Users, Wallet } from 'lucide-vue-next'
import { computed, type Component } from 'vue'

import { formatCurrency, formatNumber, formatPercent } from '../../lib/format'
import { language, useT } from '../../lib/i18n'

const KPI_META = {
  revenue: {
    icon: Wallet,
    tile: 'bg-chart-1/12 text-chart-1-foreground',
    format: 'currency',
  },
  activeUsers: {
    icon: Users,
    tile: 'bg-chart-2/14 text-chart-2-foreground',
    format: 'number',
  },
  signups: {
    icon: UserPlus,
    tile: 'bg-chart-3/14 text-chart-3-foreground',
    format: 'number',
  },
  conversion: {
    icon: Target,
    tile: 'bg-chart-4/16 text-chart-4-foreground',
    format: 'percent',
  },
} as const satisfies Record<
  DashboardKpi['id'],
  { icon: Component; tile: string; format: 'currency' | 'number' | 'percent' }
>

const props = defineProps<{ kpis: DashboardKpi[] }>()

const t = useT('dashboard')

function formatValue(kpi: DashboardKpi) {
  const format = KPI_META[kpi.id].format
  if (format === 'currency') return formatCurrency(kpi.value, language.value)
  if (format === 'percent') return formatPercent(kpi.value, language.value)
  return formatNumber(kpi.value, language.value)
}

const cards = computed(() =>
  props.kpis.map((kpi) => ({
    kpi,
    meta: KPI_META[kpi.id],
    positive: kpi.change >= 0,
    value: formatValue(kpi),
  })),
)
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="card in cards"
      :key="card.kpi.id"
      :aria-label="t(`kpis.${card.kpi.id}`)"
      class="shadow-soft overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <div class="relative p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">
              {{ t(`kpis.${card.kpi.id}`) }}
            </p>
            <p class="text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">
              {{ card.value }}
            </p>
          </div>
          <span
            :class="
              cn('flex size-10 shrink-0 items-center justify-center rounded-xl', card.meta.tile)
            "
          >
            <component :is="card.meta.icon" class="size-5" aria-hidden="true" />
          </span>
        </div>
        <div class="mt-4 flex items-center gap-1.5 text-xs">
          <span
            :class="
              cn(
                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium',
                card.positive ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive',
              )
            "
          >
            <TrendingUp v-if="card.positive" class="size-3" aria-hidden="true" />
            <TrendingDown v-else class="size-3" aria-hidden="true" />
            {{ card.positive ? '+' : '' }}{{ formatPercent(card.kpi.change, language) }}
          </span>
          <span class="text-muted-foreground">{{ t('common:units.vsPrevious') }}</span>
        </div>
      </div>
    </article>
  </div>
</template>
