<script setup lang="ts">
import { DialogDescription as DialogDescriptionPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <DialogDescriptionPrimitive
    data-slot="dialog-description"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </DialogDescriptionPrimitive>
</template>
