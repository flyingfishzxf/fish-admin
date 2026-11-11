<script setup lang="ts">
import type { DashboardRange } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { ref } from 'vue'

import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useT } from '../../lib/i18n'
import ActivityList from './ActivityList.vue'
import KpiCards from './KpiCards.vue'
import { dashboardQueryOptions } from './queries'

const t = useT('dashboard')
const range = ref<DashboardRange>(7)
const query = useQuery(dashboardQueryOptions(range))
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
      <section class="shadow-soft rounded-xl border bg-card p-5 text-card-foreground">
        <div class="mb-4 space-y-1">
          <h2 class="leading-none font-semibold">{{ t('charts.activity.title') }}</h2>
          <p class="text-sm text-muted-foreground">{{ t('charts.activity.description') }}</p>
        </div>
        <ActivityList :items="(query.data.value?.activity ?? []).slice(0, 8)" />
      </section>
    </template>
  </div>
</template>
