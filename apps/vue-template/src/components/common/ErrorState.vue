<script setup lang="ts">
import { Button, cn } from '@fish-admin/vue'
import { AlertTriangle, RotateCcw } from 'lucide-vue-next'

import { useT } from '../../lib/i18n'

const props = defineProps<{
  title?: string
  description?: string
  onRetry?: () => void
  class?: string
}>()

const t = useT('common')
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center',
        props.class,
      )
    "
  >
    <div
      class="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
    >
      <AlertTriangle class="size-5" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-semibold">{{ title ?? t('states.error.title') }}</p>
      <p class="mx-auto max-w-sm text-sm text-muted-foreground">
        {{ description ?? t('states.error.description') }}
      </p>
    </div>
    <Button v-if="onRetry" variant="outline" size="sm" @click="onRetry">
      <RotateCcw class="size-4" />
      {{ t('actions.retry') }}
    </Button>
  </div>
</template>
