<script setup lang="ts">
import { DialogOverlay as DialogOverlayPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogOverlayPrimitive
    data-slot="dialog-overlay"
    :class="
      cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none!',
        props.class,
      )
    "
  />
</template>
