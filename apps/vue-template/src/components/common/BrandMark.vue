<script setup lang="ts">
import { Fish } from 'lucide-vue-next'
import { cn } from '@fish-admin/vue'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    :class="
      cn(
        'bg-brand shadow-glow flex size-9 shrink-0 items-center justify-center rounded-xl text-white',
        props.class,
      )
    "
  >
    <Fish class="size-5" :stroke-width="2.2" />
  </div>
</template>
