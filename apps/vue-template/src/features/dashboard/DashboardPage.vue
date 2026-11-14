<script setup lang="ts">
import type { DashboardRange } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { Button } from '@fish-admin/vue'
import { Compass } from 'lucide-vue-next'
import { ref } from 'vue'

import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import Tour from '../../components/layout/Tour.vue'
import type { TourStep } from '../../components/layout/tour'
import { useT } from '../../lib/i18n'
import ActivityList from './ActivityList.vue'
import ChannelsChart from './ChannelsChart.vue'
import KpiCards from './KpiCards.vue'
import RevenueChart from './RevenueChart.vue'
import TrafficChart from './TrafficChart.vue'
import { dashboardQueryOptions } from './queries'

const t = useT('dashboard')
const range = ref<DashboardRange>(7)
const query = useQuery(dashboardQueryOptions(range))
const tourOpen = ref(false)

// Anchors live on the shell, so the tour follows whatever chrome the chosen
// layout renders; a step whose target is absent is skipped, not fatal.
const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    titleKey: 'tour.steps.sidebar.title',
    descriptionKey: 'tour.steps.sidebar.description',
    placement: 'right',
  },
  {
    target: '[data-tour="search"]',
    titleKey: 'tour.steps.search.title',
    descriptionKey: 'tour.steps.search.description',
  },
  {
    target: '[data-tour="notifications"]',
    titleKey: 'tour.steps.notifications.title',
    descriptionKey: 'tour.steps.notifications.description',
  },
  {
    target: '[data-tour="account"]',
    titleKey: 'tour.steps.account.title',
    descriptionKey: 'tour.steps.account.description',
  },
]
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <div class="flex items-center gap-1 rounded-lg border bg-card p-1">
          <button
            v-for="option in [7, 30] as const"
            :key="option"
            type="button"
            :data-range="option"
            :aria-pressed="range === option"
            :class="
              range === option
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            "
            class="rounded-md px-3 py-1 text-xs font-medium transition"
            @click="range = option"
          >
            {{ t(`range.${option}`) }}
          </button>
        </div>
        <Button variant="outline" size="sm" data-action="start-tour" @click="tourOpen = true">
          <Compass class="size-4" />
          {{ t('tour.start') }}
        </Button>
      </template>
    </PageHeader>

    <div v-if="query.isPending.value" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="index in 4"
        :key="index"
        class="h-32 animate-pulse rounded-xl border bg-muted/40"
      />
    </div>
    <ErrorState
      v-else-if="query.isError.value"
      :title="t('errors.title')"
      :description="t('errors.description')"
      @retry="query.refetch()"
    />
    <template v-else>
      <KpiCards :kpis="query.data.value?.kpis ?? []" />

      <div class="grid gap-4 lg:grid-cols-3">
        <section
          data-dashboard-card="revenue"
          class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground lg:col-span-2"
        >
          <div class="mb-4 space-y-1">
            <h2 class="leading-none font-semibold">{{ t('charts.revenue.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('charts.revenue.description') }}</p>
          </div>
          <RevenueChart :data="query.data.value?.revenue ?? []" />
        </section>

        <section
          data-dashboard-card="channels"
          class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground"
        >
          <div class="mb-4 space-y-1">
            <h2 class="leading-none font-semibold">{{ t('charts.channels.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('charts.channels.description') }}</p>
          </div>
          <ChannelsChart :data="query.data.value?.channels ?? []" />
        </section>

        <section
          data-dashboard-card="traffic"
          class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground lg:col-span-2"
        >
          <div class="mb-4 space-y-1">
            <h2 class="leading-none font-semibold">{{ t('charts.traffic.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('charts.traffic.description') }}</p>
          </div>
          <TrafficChart :data="query.data.value?.traffic ?? []" />
        </section>

        <section
          data-dashboard-card="activity"
          class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground"
        >
          <div class="mb-4 space-y-1">
            <h2 class="leading-none font-semibold">{{ t('charts.activity.title') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('charts.activity.description') }}</p>
          </div>
          <ActivityList :items="(query.data.value?.activity ?? []).slice(0, 8)" />
        </section>
      </div>
    </template>

    <Tour v-model:open="tourOpen" :steps="TOUR_STEPS" />
  </div>
</template>
