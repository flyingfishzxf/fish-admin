<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { computed } from 'vue'

const props = defineProps<{ code: string; class?: string }>()
// The prefix carries no information in a badge this small; React strips it too.
const short = computed(() => props.code.replace(/^WF-/, ''))
</script>

<template>
  <span
    aria-hidden="true"
    :class="
      cn(
        'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 px-2 text-center text-[11px] font-semibold tracking-wide text-accent-foreground',
        props.class,
      )
    "
    data-workflow-code
  >
    {{ short }}
  </span>
</template>
