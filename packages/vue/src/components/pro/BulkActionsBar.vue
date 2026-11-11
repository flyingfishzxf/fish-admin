<script setup lang="ts">
import { X } from 'lucide-vue-next'

import { cn } from '../../lib/utils'
import Badge from '../ui/badge/Badge.vue'
import { Button } from '../ui/button'

defineProps<{ label: string; regionLabel?: string; clearLabel: string }>()
const emit = defineEmits<{ clear: [] }>()

const barClass = cn(
  'fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-xl backdrop-blur sm:rounded-full',
)
</script>

<template>
  <div
    data-slot="bulk-actions-bar"
    role="region"
    :aria-label="regionLabel ?? label"
    :class="barClass"
  >
    <Badge variant="secondary" class="rounded-full px-2.5 font-normal">{{ label }}</Badge>
    <slot />
    <Button variant="ghost" size="icon-sm" :aria-label="clearLabel" @click="emit('clear')">
      <X class="size-4" />
    </Button>
  </div>
</template>
