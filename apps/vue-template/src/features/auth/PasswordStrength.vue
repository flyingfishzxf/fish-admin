<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { computed } from 'vue'

import { useT } from '../../lib/i18n'
import { analyzePassword } from './password'

const props = defineProps<{ password: string }>()
const t = useT()

const LEVEL_KEYS = ['weak', 'fair', 'good', 'strong'] as const
const LEVEL_STYLES = ['bg-destructive', 'bg-amber-500', 'bg-chart-1', 'bg-emerald-500'] as const

const analysis = computed(() => analyzePassword(props.password))
const level = computed(() => LEVEL_KEYS[Math.min(analysis.value.score, 4) - 1] ?? 'weak')
const tone = computed(() => LEVEL_STYLES[Math.min(analysis.value.score, 4) - 1] ?? LEVEL_STYLES[0])

const checks = computed(() => [
  { key: 'length', passed: analysis.value.checks.length },
  {
    key: 'mixed',
    passed: analysis.value.checks.lowercase && analysis.value.checks.number,
  },
  {
    key: 'symbol',
    passed: analysis.value.checks.uppercase && analysis.value.checks.symbol,
  },
])
</script>

<template>
  <div v-if="props.password" class="space-y-2" aria-live="polite">
    <div class="flex items-center gap-2">
      <div class="flex flex-1 gap-1">
        <span
          v-for="index in 4"
          :key="index"
          class="h-1 flex-1 rounded-full transition-colors"
          :class="index <= analysis.score ? tone : 'bg-muted'"
        />
      </div>
      <span class="text-[11px] text-muted-foreground">
        {{ t(`auth:passwordStrength.${level}`) }}
      </span>
    </div>
    <ul class="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
      <li
        v-for="check in checks"
        :key="check.key"
        class="flex items-center gap-1"
        :class="check.passed ? 'text-emerald-600' : 'text-muted-foreground'"
      >
        <Check v-if="check.passed" class="size-3" aria-hidden="true" />
        <span class="size-3" v-else aria-hidden="true" />
        {{ t(`auth:passwordChecks.${check.key}`) }}
      </li>
    </ul>
  </div>
</template>
