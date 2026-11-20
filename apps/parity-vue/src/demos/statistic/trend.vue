<script lang="ts">
export default { name: 'StatisticTrend' }
</script>

<script setup lang="ts">
import { ref } from 'vue'

import { Button, Statistic } from '@fish-admin/vue'
import { Activity, Clock, ShieldCheck, TrendingUp } from 'lucide-vue-next'

const loading = ref(false)
</script>

<template>
  <div class="fish-demo-stack" style="max-width: none">
    <div class="fish-demo-row">
      <Button size="sm" variant="outline" @click="loading = !loading">
        {{ loading ? 'Show the value' : 'Preview the loading state' }}
      </Button>
      <span class="fish-demo-muted">
        Loading replaces the number with two skeletons and sets aria-busy on the card.
      </span>
    </div>
    <div
      style="
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        width: 100%;
      "
    >
      <Statistic
        label="Monthly recurring revenue"
        :value="48250"
        prefix="$"
        :loading="loading"
        :trend="{ value: 12.4, label: 'vs last month' }"
        :icon="TrendingUp"
      />
      <Statistic
        label="Open incidents"
        :value="3"
        :trend="{ value: 0, label: 'vs last week' }"
        :icon="Activity"
      />
      <Statistic label="Uptime, last 30 days" value="99.98%" :icon="ShieldCheck" />
      <Statistic
        label="Median response time"
        value="312"
        suffix="ms"
        :trend="{ value: -8.2, label: 'vs last week' }"
        :icon="Clock"
      />
    </div>
  </div>
</template>
