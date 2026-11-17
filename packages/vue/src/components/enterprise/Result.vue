<script setup lang="ts">
import { AlertTriangle, CheckCircle2, FileQuestion, Info, XCircle } from 'lucide-vue-next'
import { computed } from 'vue'

import { cn } from '../../lib/utils'

export type ResultStatus = 'success' | 'info' | 'warning' | 'error' | 'not-found'

const props = defineProps<{
  /** Outcome to show; also picks the icon and the icon tile colours. */
  status: ResultStatus
  /** Main message, rendered as an h2. */
  title: string
  /** Supporting sentence, centred and capped at max-w-md. */
  description?: string
  class?: string
}>()

const RESULT_STYLES: Record<ResultStatus, { icon: typeof CheckCircle2; tile: string }> = {
  success: { icon: CheckCircle2, tile: 'bg-chart-3/14 text-chart-3-foreground' },
  info: { icon: Info, tile: 'bg-chart-1/12 text-chart-1-foreground' },
  warning: { icon: AlertTriangle, tile: 'bg-chart-4/16 text-chart-4-foreground' },
  error: { icon: XCircle, tile: 'bg-destructive/10 text-destructive' },
  'not-found': { icon: FileQuestion, tile: 'bg-muted text-muted-foreground' },
}

const style = computed(() => RESULT_STYLES[props.status])
</script>

<template>
  <div
    :role="props.status === 'error' ? 'alert' : 'status'"
    :class="cn('flex flex-col items-center gap-4 px-6 py-16 text-center', props.class)"
  >
    <span :class="cn('flex size-14 items-center justify-center rounded-2xl', style.tile)">
      <component :is="style.icon" class="size-7" />
    </span>
    <div class="space-y-1.5">
      <h2 class="text-lg font-semibold">{{ props.title }}</h2>
      <div v-if="props.description" class="mx-auto max-w-md text-sm text-muted-foreground">
        {{ props.description }}
      </div>
    </div>
    <div v-if="$slots.extra" class="flex flex-wrap items-center justify-center gap-2">
      <slot name="extra" />
    </div>
  </div>
</template>
