<script setup lang="ts">
import { cn } from '../../../lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <td
    data-slot="table-cell"
    :class="
      cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]',
        $props.class,
      )
    "
  >
    <slot />
  </td>
</template>
